# RSA 密码加密功能文档

## 概述

为了确保数据源连接的安全性，前端在创建/更新数据源时会自动使用RSA加密算法对密码进行加密，后端在建立连接时自动解密。

## 技术实现

### 加密算法
- **算法**: RSA/ECB/PKCS1Padding
- **密钥长度**: 2048位
- **编码方式**: Base64

### 密钥位置
- **前端公钥**: `frontend/src/utils/rsaUtil.ts` (已内置)
- **后端私钥**: `services/app/data-connection/dc-main/src/main/resources/private_key.pem`
- **后端公钥**: `services/app/data-connection/dc-main/src/main/resources/public_key.pem`

### 使用库
- **前端**: [jsencrypt](https://github.com/travist/jsencrypt) - 纯JavaScript RSA加密库
- **后端**: Java原生Cipher + BouncyCastle Provider

## 使用说明

### 自动加密（推荐）

**在大多数情况下，密码加密是自动进行的，无需手动操作。**

#### 创建数据源示例

```typescript
import { dataSourceService } from '@/services/dataSourceService';

// 创建数据源时，密码会自动加密
const newDataSource = {
    name: 'Production MySQL',
    type: 'MySQL',
    host: '192.168.1.100',
    port: 3306,
    dbName: 'production_db',
    username: 'admin',
    password: 'MyPassword123',  // ← 明文密码，会自动加密
    schemaName: '',
    desc: '生产环境数据库'
};

await dataSourceService.createDataSource(newDataSource);
// 密码已自动使用RSA加密发送到后端
```

#### 更新数据源示例

```typescript
// 更新数据源时，密码同样会自动加密
await dataSourceService.updateDataSource('datasource-id', {
    password: 'NewPassword456'  // ← 明文密码，会自动加密
});
```

#### 测试连接示例

```typescript
// 测试连接时，密码也会自动加密
const result = await dataSourceService.testConnection({
    name: 'Test Connection',
    type: 'MySQL',
    host: '192.168.1.100',
    port: 3306,
    dbName: 'test_db',
    username: 'admin',
    password: 'TestPassword789'  // ← 明文密码，会自动加密
});
```

### 手动加密（高级场景）

如果需要在其他地方使用RSA加密，可以手动调用加密函数：

```typescript
import { encryptRSA } from '@/utils/rsaUtil';

// 加密密码
const plainPassword = 'MyPassword123';
const encryptedPassword = encryptRSA(plainPassword);

console.log('加密后的密码:', encryptedPassword);
// 输出类似: "XHB3C9vK...（长串Base64字符）"
```

### 禁用加密（开发调试）

如需在开发环境禁用加密（不推荐生产环境）：

```typescript
import { setRSAEnabled } from '@/utils/rsaUtil';

// 禁用加密
setRSAEnabled(false);

// 启用加密（默认）
setRSAEnabled(true);
```

## 后端解密

后端会在以下位置自动解密密码：

### JdbcBaseClient.java

```java
// 文件位置: dc-common/src/main/java/com/eisoo/dc/common/util/jdbc/db/impl/JdbcBaseClient.java

// 获取表列表时解密密码
String fPassword = dataSourceEntity.getFPassword();
if (StringUtils.isNotEmpty(fPassword)) {
    fPassword = RSAUtil.decrypt(fPassword);  // RSA解密
}
```

### RSAUtil.java

```java
// 文件位置: dc-common/src/main/java/com/eisoo/dc/common/util/RSAUtil.java

/**
 * RSA解密
 */
public static String decrypt(String encryptedData) {
    byte[] keyBytes = Base64.decodeBase64(ENCRYPT_PRIVATE_KEY);
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
    KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
    PrivateKey priKey = keyFactory.generatePrivate(keySpec);

    Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
    cipher.init(Cipher.DECRYPT_MODE, priKey);
    byte[] decodedData = Base64.decodeBase64(encryptedData);
    byte[] decryptedData = cipher.doFinal(decodedData);
    return new String(decryptedData, StandardCharsets.UTF_8);
}
```

## 密钥管理

### 生成新的RSA密钥对

如果需要重新生成密钥对：

```bash
cd services/app/data-connection/dc-main/src/main/resources

# 生成私钥
openssl genrsa -out private_key.pem 2048

# 从私钥提取公钥
openssl rsa -in private_key.pem -pubout -out public_key.pem

# 更新前端公钥
# 1. 复制 public_key.pem 的内容
# 2. 更新 frontend/src/utils/rsaUtil.ts 中的 RSA_PUBLIC_KEY 常量
```

### 密钥格式

**公钥格式（前端使用）**:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

**私钥格式（后端使用）**:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD...
-----END PRIVATE KEY-----
```

## 安全注意事项

### ✅ 最佳实践

1. **不要在代码中硬编码私钥** - 私钥应通过配置文件或密钥管理服务加载
2. **定期轮换密钥** - 建议每6-12个月更换一次RSA密钥对
3. **保护私钥文件** - 确保私钥文件权限设置为仅应用可读（chmod 600）
4. **使用HTTPS** - 确保所有API通信使用TLS加密
5. **不记录敏感信息** - 避免在日志中记录明文密码

### ⚠️ 注意事项

1. **公钥可以公开** - 前端代码中的公钥是安全的，可以暴露
2. **加密长度限制** - RSA 2048位密钥最多加密245字节数据
3. **性能考虑** - RSA加密比对称加密慢，但仅用于小数据（密码）影响不大
4. **错误处理** - 如果解密失败，后端会抛出异常并记录日志

## 故障排查

### 常见问题

#### 1. 创建数据源失败：密码解密错误

**原因**: 前后端密钥不匹配

**解决方案**:
```bash
# 确认前后端使用相同的密钥对
# 1. 检查前端公钥: frontend/src/utils/rsaUtil.ts
# 2. 检查后端私钥: dc-main/src/main/resources/private_key.pem
# 3. 如不匹配，重新生成密钥对并更新
```

#### 2. 连接数据库失败：密码错误

**原因**: 密码未正确加密或后端解密失败

**排查步骤**:
```java
// 在后端添加日志查看解密后的密码
String decryptedPassword = RSAUtil.decrypt(fPassword);
log.info("解密后的密码: {}", decryptedPassword);
```

```typescript
// 在前端检查加密是否成功
const encrypted = encryptRSA('test');
console.log('加密结果:', encrypted);
// 应该输出长串Base64字符，不是原文
```

#### 3. 测试连接返回401未授权

**原因**: 认证token问题，与密码加密无关

**解决方案**: 检查JWT token是否正确设置

## 测试验证

### 前端测试

```typescript
import { encryptRSA } from '@/utils/rsaUtil';

// 测试加密功能
const testPassword = 'TestPassword123';
const encrypted = encryptRSA(testPassword);

console.log('原文:', testPassword);
console.log('密文:', encrypted);
console.log('密文长度:', encrypted.length);

// 验证加密结果（密文应该与原文不同）
if (encrypted !== testPassword && encrypted.length > 100) {
    console.log('✅ 加密成功');
} else {
    console.log('❌ 加密失败');
}
```

### 后端测试

```java
import com.eisoo.dc.common.util.RSAUtil;

// 测试解密功能
String encryptedPassword = "加密后的Base64字符串";
String decrypted = RSAUtil.decrypt(encryptedPassword);

System.out.println("解密结果: " + decrypted);
// 应该输出原始密码
```

## 技术支持

如有问题，请查看：
- 后端RSA工具类: `dc-common/src/main/java/com/eisoo/dc/common/util/RSAUtil.java`
- 前端RSA工具类: `frontend/src/utils/rsaUtil.ts`
- JDBC客户端: `dc-common/src/main/java/com/eisoo/dc/common/util/jdbc/db/impl/JdbcBaseClient.java:62-64`

## 更新日志

### 2026-01-27
- ✅ 初始实现RSA密码加密功能
- ✅ 前端集成jsencrypt库
- ✅ 自动加密数据源密码
- ✅ 生成RSA 2048位密钥对
- ✅ 更新dataSourceService集成加密逻辑