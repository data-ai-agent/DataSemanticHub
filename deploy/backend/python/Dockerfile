FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖 (build-essential, pkg-config, default-libmysqlclient-dev for PyMySQL/mysqlclient if needed)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
# 注意：构建上下文是项目根目录
COPY services/app/agent-service/requirements.txt requirements.txt

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目代码
COPY services/app/agent-service/ /app/

# 设置环境变量
ENV PYTHONPATH=/app
ENV PORT=8891

# 暴露端口
EXPOSE 8891

# 启动命令
CMD ["python", "vanna-api/main.py"]
