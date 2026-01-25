
import os
import time
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# 设置 OpenAI base_url（必须在导入 vanna 之前设置）
llm_base_url = os.getenv("LLM_BASE_URL")
if llm_base_url:
    os.environ["OPENAI_API_BASE"] = llm_base_url
    os.environ["OPENAI_BASE_URL"] = llm_base_url

from vanna.remote import VannaDefault
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore

# 导入配置模块
from config import get_db_config, get_vanna_config
from chart_recommender import recommend_chart_type

# 配置日志
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 定义请求模型
class QuestionRequest(BaseModel):
    question: str
    db_name: Optional[str] = None

class SqlRequest(BaseModel):
    question: Optional[str] = None
    sql: str
    db_name: Optional[str] = None

class TrainRequest(BaseModel):
    ddl: Optional[str] = None
    documentation: Optional[str] = None
    sql: Optional[str] = None
    question: Optional[str] = None

class TrainResponse(BaseModel):
    id: str
    training_data_type: str
    question: Optional[str] = None
    content: str


# 初始化 FastAPI
app = FastAPI(title="Vanna AI API", description="API wrapper for Vanna text-to-SQL", version="1.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Vanna
# 根据环境变量灵活配置，支持三种模式：
# 1. VannaDefault (Remote) - 使用 Vanna API
# 2. OpenAI/DeepSeek + ChromaDB (Local) - 使用云端 API
# 3. Ollama + ChromaDB (Local) - 使用本地 Ollama 模型

vn = None

# 定义自定义 Vanna 类
class MyVannaOpenAI(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        OpenAI_Chat.__init__(self, config=config)

def setup_vanna():
    global vn
    
    # 1. 从配置文件读取数据库配置 (MariaDB)
    db_config = get_db_config()
    db_host = db_config['host']
    db_port = db_config['port']
    db_name = db_config['database']
    db_user = db_config['user']
    db_password = db_config['password']
    
    # 2. 从配置文件读取 Vanna 配置
    vanna_config = get_vanna_config()
    chroma_db_path = vanna_config['chroma_db_path']
    os.makedirs(chroma_db_path, exist_ok=True)

    # 3. 根据配置选择 Vanna 模式
    vanna_api_key = vanna_config['vanna_api_key']
    vanna_model_name = vanna_config['vanna_model']
    use_ollama = vanna_config['use_ollama']
    
    if vanna_api_key and vanna_model_name:
        # 模式 1: 使用 VannaDefault (Remote)
        logger.info(f"🚀 正在使用 Remote Vanna 模型: {vanna_model_name}")
        vn = VannaDefault(model=vanna_model_name, api_key=vanna_api_key)
    elif use_ollama:
        # 模式 3: 使用本地 Ollama
        try:
            from vanna.ollama import Ollama
            class MyVannaOllama(ChromaDB_VectorStore, Ollama):
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config=config)
                    Ollama.__init__(self, config=config)
            
            ollama_model = vanna_config['ollama_model']
            ollama_host = vanna_config['ollama_host']
            
            config = {
                'model': ollama_model,
                'ollama_host': ollama_host,
                'path': chroma_db_path
            }
            logger.info(f"🚀 正在使用本地 Ollama 模型: {config['model']} (host: {ollama_host})")
            vn = MyVannaOllama(config=config)
        except ImportError:
            logger.error("Ollama support not available. Please install vanna[ollama]")
            return
    else:
        # 模式 2: 使用 OpenAI/DeepSeek + ChromaDB (Local)
        openai_api_key = vanna_config['openai_api_key']
        llm_model = vanna_config['llm_model']
        llm_base_url = vanna_config['llm_base_url']

        if openai_api_key:
            config = {
                'api_key': openai_api_key,
                'model': llm_model,
                'path': chroma_db_path
            }
            if llm_base_url:
                logger.info(f"🚀 正在使用云端 API 模型: {llm_model} (base_url: {llm_base_url})")
            else:
                logger.info(f"🚀 正在使用云端 API 模型: {llm_model}")
            vn = MyVannaOpenAI(config=config)
        else:
            logger.warning("⚠️ 未找到 Vanna API Key、OpenAI API Key 或未启用 Ollama。Vanna 将无法正常初始化。")
            return

    # 4. 等待数据库启动并连接
    logger.info("⏳ 等待数据库启动...")
    max_retries = 10
    retry_delay = 3
    
    for attempt in range(max_retries):
        try:
            vn.connect_to_mysql(
                host=db_host,
                dbname=db_name,
                user=db_user,
                password=db_password,
                port=db_port
            )
            logger.info(f"✅ 已连接到 MariaDB: {db_host}:{db_port}/{db_name}")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"数据库连接失败 (尝试 {attempt + 1}/{max_retries}): {e}，{retry_delay} 秒后重试...")
                time.sleep(retry_delay)
            else:
                logger.error(f"❌ 数据库连接失败，已重试 {max_retries} 次: {e}")
                raise

@app.on_event("startup")
async def startup_event():
    setup_vanna()

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "ok", "vanna_initialized": vn is not None}

@app.post("/api/v1/generate_sql")
def generate_sql(request: QuestionRequest):
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        sql = vn.generate_sql(question=request.question)
        return {"sql": sql}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/run_sql")
def run_sql(request: SqlRequest):
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        df = vn.run_sql(sql=request.sql)
        # Convert DataFrame to list of dicts for JSON response
        results = df.to_dict(orient='records') if df is not None else []
        return {"data": results, "columns": df.columns.tolist() if df is not None else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ask")
def ask(request: QuestionRequest):
    """
    Combined generate and run
    返回 SQL、数据以及图表推荐信息
    """
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        # Vanna's ask function usually prints, so we use generate_sql + run_sql
        sql = vn.generate_sql(question=request.question)
        df = vn.run_sql(sql=sql)
        
        results = df.to_dict(orient='records') if df is not None else []
        columns = df.columns.tolist() if df is not None else []
        
        # 图表推荐：基于问题语义和数据特征
        chart_recommendation = None
        if len(results) > 0:
            try:
                # 取前10行作为样本进行分析
                data_sample = results[:10]
                chart_recommendation = recommend_chart_type(
                    question=request.question,
                    columns=columns,
                    data_sample=data_sample,
                    row_count=len(results)
                )
                logger.info(f"📊 图表推荐: {chart_recommendation['type']} - {chart_recommendation['reason']}")
            except Exception as e:
                logger.warning(f"图表推荐失败: {e}")
        
        return {
            "question": request.question,
            "sql": sql,
            "data": results,
            "columns": columns,
            "chart_recommendation": chart_recommendation  # 新增图表推荐
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/train")
def train(request: TrainRequest):
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        id = None
        if request.ddl:
            id = vn.train(ddl=request.ddl)
        elif request.documentation:
            id = vn.train(documentation=request.documentation)
        elif request.sql and request.question:
            id = vn.train(sql=request.sql, question=request.question)
        else:
            raise HTTPException(status_code=400, detail="Invalid training request. Provide ddl, documentation, or sql+question.")
            
        return {"status": "success", "id": str(id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/training_data")
def get_training_data():
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        df = vn.get_training_data()
        return {"data": df.to_dict(orient='records') if df is not None else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.delete("/api/v1/training_data/{id}")
def remove_training_data(id: str):
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
        
    try:
        success = vn.remove_training_data(id=id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    from config import get_config
    config = get_config()
    port = config.get('server.port', 8891, 'PORT')
    host = config.get('server.host', '0.0.0.0', 'HOST')
    uvicorn.run(app, host=host, port=port)
