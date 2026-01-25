# Faker Data Service

用于生成测试数据并存储到 MySQL 数据库的服务。

## 功能特性

- 生成多种业务场景的测试数据
- 支持中文本地化（Faker zh_CN）
- 可配置数据量
- 支持批量插入，性能优化
- 自动创建数据库和表结构

## 数据表

| 表名 | 描述 | 默认数据量 |
|------|------|-----------|
| products | 产品信息 | 100 |
| customers | 客户信息 | 500 |
| orders | 订单记录 | 1000 |
| employees | 员工信息 | 50 |
| sales | 销售记录 | 2000 |
| website_traffic | 网站流量 | 10000 |
| inventory | 库存信息 | 200 |

## 环境变量

```bash
# 数据库配置
DB_HOST=mariadb
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Change_Me_Please_123!
DB_NAME=ai-test-data

# Faker 配置
FAKER_LOCALE=zh_CN    # 语言本地化
FAKER_SEED=12345       # 随机种子（保证数据可复现）
```

## 使用方法

### 基本使用

```bash
# 生成所有表的数据（使用默认数量）
python main.py --all

# 只创建表结构，不生成数据
python main.py --create-only

# 显示所有表的记录数
python main.py --show
```

### 指定表和数据量

```bash
# 生成指定表的数据
python main.py --tables products customers

# 指定某张表的数据量
python main.py --products 500 --customers 1000

# 组合使用
python main.py --tables products orders --products 200 --orders 5000
```

### 参数说明

```
--tables TABLES [TABLES ...]  要生成数据的表名
--all                         生成所有表的数据
--counts COUNTS [COUNTS ...]  每张表生成的数据量
--products N                  产品表数据量 (默认: 100)
--customers N                 客户表数据量 (默认: 500)
--orders N                    订单表数据量 (默认: 1000)
--employees N                 员工表数据量 (默认: 50)
--sales N                     销售记录数据量 (默认: 2000)
--website-traffic N           网站流量数据量 (默认: 10000)
--inventory N                 库存表数据量 (默认: 200)
--create-only                 只创建表结构，不生成数据
--show                        显示所有表的记录数
```

## 示例

```bash
# 生成少量数据用于快速测试
python main.py --all --products 50 --customers 100 --orders 200

# 生成大量数据用于性能测试
python main.py --all --website-traffic 100000

# 只生成产品表数据
python main.py --tables products --products 1000
```

## Docker 部署

在 `docker-compose.yaml` 中添加服务：

```yaml
faker-data-service:
  build:
    context: ..
    dockerfile: deploy/backend/python/Dockerfile
  container_name: datasemantichub-faker-data
  environment:
    - DB_HOST=mariadb
    - DB_PORT=3306
    - DB_USER=root
    - DB_PASSWORD=${DB_PASSWORD}
    - DB_NAME=ai-test-data
    - FAKER_LOCALE=zh_CN
  volumes:
    - ./app/faker-data-service:/app/faker-data-service
  networks:
    - datasemantichub-network
```

运行：

```bash
# 生成数据
docker-compose run --rm faker-data-service python /app/faker-data-service/main.py --all
```
