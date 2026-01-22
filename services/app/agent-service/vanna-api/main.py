
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from vanna.remote import VannaDefault
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore

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
# 这里我们定义一个自定义的 Vanna 类，可以根据环境变量灵活配置
# 为了演示，我们先尝试使用 OpenAI + ChromaDB 的组合，或者使用 VannaDefault (如果用户有 Vanna API key)
# 如果环境变量中有 VANNA_API_KEY 和 VANNA_MODEL，则使用 VannaDefault (Remote)
# 否则尝试使用本地配置 (OpenAI + ChromaDB)

vn = None

class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        OpenAI_Chat.__init__(self, config=config)

def setup_vanna():
    global vn
    
    # 1. 尝试连接数据库 (MariaDB)
    # 从环境变量读取配置
    db_host = os.getenv("DB_HOST", "mariadb")
    db_port = int(os.getenv("DB_PORT", 3306))
    db_name = os.getenv("DB_NAME", "datasemantichub")
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")

    # 2. 初始化 Vanna 模型
    vanna_api_key = os.getenv("VANNA_API_KEY")
    vanna_model_name = os.getenv("VANNA_MODEL")
    
    if vanna_api_key and vanna_model_name:
        logger.info(f"Using Remote Vanna model: {vanna_model_name}")
        vn = VannaDefault(model=vanna_model_name, api_key=vanna_api_key)
    else:
        # Fallback to OpenAI + ChromaDB (Local)
        # 需要 OPENAI_API_KEY
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            logger.info("Using Local Vanna (OpenAI + ChromaDB)")
            vn = MyVanna(config={'api_key': openai_api_key, 'model': 'gpt-3.5-turbo'}) # Default to 3.5 turbo
        else:
            logger.warning("No Vanna API Key or OpenAI API Key found. Vanna will not be initialized properly.")
            return

    # 连接到数据库
    try:
        vn.connect_to_mysql(
            host=db_host,
            dbname=db_name,
            user=db_user,
            password=db_password,
            port=db_port
        )
        logger.info(f"Connected to MariaDB at {db_host}:{db_port}/{db_name}")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")

@app.on_event("startup")
async def startup_event():
    setup_vanna()

@app.get("/health")
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
    """
    if not vn:
        raise HTTPException(status_code=503, detail="Vanna is not initialized")
    
    try:
        # Vanna's ask function usually prints, so we use generate_sql + run_sql
        sql = vn.generate_sql(question=request.question)
        df = vn.run_sql(sql=sql)
        
        results = df.to_dict(orient='records') if df is not None else []
        
        return {
            "question": request.question,
            "sql": sql,
            "data": results,
            "columns": df.columns.tolist() if df is not None else []
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
    port = int(os.getenv("PORT", 8891))
    uvicorn.run(app, host="0.0.0.0", port=port)
