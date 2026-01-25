# Excel 数据导入功能

用于从 Excel 文件导入数据到 MariaDB 数据库。

## 安装依赖

```bash
pip install -r requirements.txt
```

新增依赖：
- `pandas>=2.0.0` - 数据处理
- `openpyxl>=3.1.0` - Excel 文件读取

## 使用方法

### 1. 导入单个文件

```bash
# 导入到同名表（文件名作为表名）
python import_excel.py data/products.xlsx

# 导入到指定表
python import_excel.py data/products.xlsx --table products

# 指定工作表
python import_excel.py data.xlsx --sheet "Sheet1"

# 导入前清空表
python import_excel.py data/products.xlsx --truncate
```

### 2. 导入整个目录

```bash
# 导入目录下所有 .xlsx 文件
python import_excel.py --directory data/

# 使用自定义文件模式
python import_excel.py --directory data/ --pattern "*.xls"
```

### 3. 处理重复数据

```bash
# 遇到重复键时跳过（默认）
python import_excel.py data/products.xlsx --on-duplicate skip

# 遇到重复键时更新
python import_excel.py data/products.xlsx --on-duplicate update

# 遇到重复键时忽略（静默跳过）
python import_excel.py data/products.xlsx --on-duplicate ignore
```

### 4. 批量大小控制

```bash
# 设置批量插入大小（默认 1000）
python import_excel.py data/products.xlsx --batch-size 500
```

## Excel 文件要求

### 文件格式

1. **文件命名**：文件名将作为默认表名（不含扩展名）
   - `products.xlsx` → 表名 `products`
   - `customer_data.xlsx` → 表名 `customer_data`

2. **列命名**：
   - 第一行必须是列名
   - 列名应与数据库表的字段名匹配
   - 不匹配的列会被自动过滤

3. **数据类型**：
   - 系统会自动转换常见数据类型
   - 空值会被转为 NULL

### 示例 Excel 文件

| id | name | category | brand | price | stock |
|----|------|----------|-------|-------|-------|
| 1 | 产品A | 电子产品 | Apple | 5999 | 100 |
| 2 | 产品B | 电子产品 | Samsung | 4999 | 150 |

## 完整命令示例

```bash
# 导入产品数据，遇到重复更新，批量大小 500
python import_excel.py \
    data/products.xlsx \
    --table products \
    --on-duplicate update \
    --batch-size 500

# 导入整个目录，导入前清空所有表
python import_excel.py \
    --directory ./excel_files \
    --truncate

# 导入指定工作表
python import_excel.py \
    data.xlsx \
    --table sales \
    --sheet "2024年销售数据"
```

## 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `file` | Excel 文件路径 | - |
| `--table` | 目标表名 | 文件名 |
| `--sheet` | 工作表名称 | 第一个工作表 |
| `--directory` | 导入目录 | - |
| `--truncate` | 导入前清空表 | False |
| `--on-duplicate` | 重复处理方式 | skip |
| `--batch-size` | 批量插入大小 | 1000 |
| `--pattern` | 文件匹配模式 | *.xlsx |

## 注意事项

1. **表结构**：确保目标表已存在，脚本不会自动创建表
2. **列匹配**：Excel 列名必须与表字段名匹配（大小写敏感）
3. **主键冲突**：根据 `--on-duplicate` 参数处理
4. **大文件**：建议使用 `--batch-size` 控制内存使用
5. **数据验证**：建议先备份数据库

## 常见问题

### Q: 如何创建测试用的 Excel 文件？

```python
import pandas as pd

# 创建示例数据
data = {
    'name': ['产品A', '产品B', '产品C'],
    'category': ['电子产品', '家居用品', '服装'],
    'price': [5999, 299, 199]
}

# 保存为 Excel
df = pd.DataFrame(data)
df.to_excel('products.xlsx', index=False)
```

### Q: 支持哪些 Excel 格式？

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.xlsm` (带宏的 Excel)

### Q: 如何处理日期类型？

pandas 会自动识别 Excel 中的日期，建议在 Excel 中将单元格格式设置为"日期"。

## 配置文件

数据库配置从 `config.py` 读取，也可以通过环境变量设置：

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=ai-test-data
export DB_USER=root
export DB_PASSWORD=your_password
```
