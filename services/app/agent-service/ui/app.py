
import os
import streamlit as st
from vanna.remote import VannaDefault
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore

# 配置页面
st.set_page_config(layout="wide", page_title="DataSemanticHub AI Agent")

# 初始化 Vanna (复用 main.py 的逻辑)
@st.cache_resource(ttl=3600)
def setup_vanna():
    # 1. 数据库连接配置
    db_host = os.getenv("DB_HOST", "mariadb")
    db_port = int(os.getenv("DB_PORT", 3306))
    db_name = os.getenv("DB_NAME", "datasemantichub")
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")

    # 2. Vanna 模型配置
    vanna_api_key = os.getenv("VANNA_API_KEY")
    vanna_model_name = os.getenv("VANNA_MODEL")
    
    vn = None
    
    if vanna_api_key and vanna_model_name:
        vn = VannaDefault(model=vanna_model_name, api_key=vanna_api_key)
    else:
        # Fallback to OpenAI + ChromaDB (Local)
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config=config)
                    OpenAI_Chat.__init__(self, config=config)
            vn = MyVanna(config={'api_key': openai_api_key, 'model': 'gpt-3.5-turbo'})
    
    if vn:
        try:
            vn.connect_to_mysql(
                host=db_host,
                dbname=db_name,
                user=db_user,
                password=db_password,
                port=db_port
            )
        except Exception as e:
            st.error(f"Database connection failed: {e}")
            return None

    return vn

vn = setup_vanna()

if not vn:
    st.warning("Vanna not initialized. Please check your environment variables (VANNA_API_KEY/VANNA_MODEL or OPENAI_API_KEY).")
else:
    # 使用 Vanna 内置的 Streamlit APP
    from vanna.flask import VannaFlaskApp
    # 注意：Vanna 目前主要提供 Flask APP，Streamlit 支持通常是自定义的
    # 我们这里使用自定义的简单界面
    
    st.title("DataSemanticHub - AI SQL Agent")
    
    my_question = st.text_input("Ask a question about your data:")
    
    if my_question:
        # Generate SQL
        sql = vn.generate_sql(question=my_question)
        st.code(sql, language='sql')
        
        # Run SQL
        try:
            df = vn.run_sql(sql=sql)
            st.dataframe(df)
            
            # Chart (Automation not fully guaranteed, relying on Vanna's internal logic if available or just plotting)
            # vn.plot_plotly_1(plotly_code=...) - Vanna generates plotly code usually.
            # Here we just show data for now.
            
            # If we want to verify generated SQL
            isValid = True # Simplified
            if isValid:
                 # Optional: Training
                 if st.button("Add to Training Data"):
                     vn.train(sql=sql, question=my_question)
                     st.success("Added to training data")
                     
        except Exception as e:
            st.error(f"SQL Execution failed: {e}")

    # Sidebar for Training Data Management
    with st.sidebar:
        st.header("Training Data")
        if st.checkbox("Show Training Data"):
            training_data = vn.get_training_data()
            if training_data is not None:
                st.dataframe(training_data)
