/**
 * RSA加密工具类
 * 用于加密数据源密码等敏感信息
 */

import JSEncrypt from 'jsencrypt';

/**
 * RSA公钥（用于加密）
 * 注意：这是公钥，可以安全地暴露在前端代码中
 */
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3ielDFnNwzHWFOLQhLi8
ZHtduRfTMfnYGxjnU0he1FtZOKJVhyzU2rDwJJQ1aCyxnz0lf4NlF7KHt3lTtu7c
mJ8jXQ4PU1oEuGXxd768i0v14Pw/T7uEs9Y+OnAmZ9qH3+dc8WgpflDPx8b9jk/j
g2oxgpu0GP2yG5RkMAZ23hP6XbSUCUCrUGn4/FS6Ng4vBCvU5Hee2TM/MCSfOFRB
wtKYt0qfMe2ZBTfyf4o5lGRaulLPGTs5+j1SSnnbkV8KNtsxeEdEJIRy4I0D1iIf
JizTXcPs1+dkilkT963fl3Dg5y+mNAlETZCeAIzXshE2m/LlFBjyjj3/4x+pUer2
4QIDAQAB
-----END PUBLIC KEY-----`;

/**
 * 加密配置
 */
const ENCRYPT_CONFIG = {
    /**
     * 是否启用加密
     * 默认：true
     * 如果需要关闭加密，可以设置为 false
     */
    enabled: true,

    /**
     * 默认公钥
     */
    defaultPublicKey: RSA_PUBLIC_KEY,
};

/**
 * RSA加密工具类
 */
export class RSAEncryptor {
    private encrypt: JSEncrypt;
    private publicKey: string;

    constructor(publicKey?: string) {
        this.encrypt = new JSEncrypt();
        this.publicKey = publicKey || ENCRYPT_CONFIG.defaultPublicKey;
        this.encrypt.setPublicKey(this.publicKey);
    }

    /**
     * 设置公钥
     * @param publicKey PEM格式的公钥
     */
    setPublicKey(publicKey: string): void {
        this.publicKey = publicKey;
        this.encrypt.setPublicKey(publicKey);
    }

    /**
     * 加密文本
     * @param plainText 明文
     * @returns Base64编码的密文，如果加密失败返回原文
     */
    encryptText(plainText: string): string {
        if (!ENCRYPT_CONFIG.enabled) {
            console.warn('[RSA] 加密已禁用，返回原文');
            return plainText;
        }

        if (!plainText) {
            return '';
        }

        try {
            const encrypted = this.encrypt.encrypt(plainText);
            if (!encrypted) {
                throw new Error('加密返回空值');
            }
            console.log('[RSA] 加密成功');
            return encrypted;
        } catch (error) {
            console.error('[RSA] 加密失败:', error);
            // 加密失败时返回原文，确保功能可用
            return plainText;
        }
    }

    /**
     * 批量加密
     * @param texts 文本数组
     * @returns 加密后的文本数组
     */
    encryptBatch(texts: string[]): string[] {
        return texts.map(text => this.encryptText(text));
    }
}

/**
 * 默认加密器实例
 */
const defaultEncryptor = new RSAEncryptor();

/**
 * RSA加密工具函数（便捷方法）
 */

/**
 * 加密文本
 * @param plainText 明文
 * @returns Base64编码的密文
 */
export const encryptRSA = (plainText: string): string => {
    return defaultEncryptor.encryptText(plainText);
};

/**
 * 设置加密公钥
 * @param publicKey PEM格式的公钥
 */
export const setRSAPublicKey = (publicKey: string): void => {
    defaultEncryptor.setPublicKey(publicKey);
};

/**
 * 启用/禁用加密
 * @param enabled 是否启用加密
 */
export const setRSAEnabled = (enabled: boolean): void => {
    ENCRYPT_CONFIG.enabled = enabled;
    console.log(`[RSA] 加密已${enabled ? '启用' : '禁用'}`);
};

/**
 * 导出类型和常量
 */
export type { RSAEncryptor };
export { ENCRYPT_CONFIG };

/**
 * 使用示例：
 *
 * import { encryptRSA } from '@/utils/rsaUtil';
 *
 * // 加密密码
 * const encryptedPassword = encryptRSA('myPassword123');
 *
 * // 在API请求中使用
 * const response = await fetch('/api/datasource', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     name: 'My Database',
 *     password: encryptRSA('myPassword123'),  // 加密后的密码
 *   }),
 * });
 */