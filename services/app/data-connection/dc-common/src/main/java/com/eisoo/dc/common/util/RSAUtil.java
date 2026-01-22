package com.eisoo.dc.common.util;

import org.apache.commons.codec.binary.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

@Component
public class RSAUtil {
    private static final Logger log = LoggerFactory.getLogger(RSAUtil.class);
    private static final String RSA_ALGORITHM = "RSA";
    private static final String CIPHER_ALGORITHM = "RSA/ECB/PKCS1Padding";

    // 加密/解密密钥对
    private static String ENCRYPT_PRIVATE_KEY;
    private static String ENCRYPT_PUBLIC_KEY;



    @Value("${rsa.privateKeyPath}")
    public void setPrivateKey(String privateKeyPath) {
        ENCRYPT_PRIVATE_KEY = cleanPemKey(loadKeyFromFile(privateKeyPath));
        log.info("rsa private key read successfully");
    }
    @Value("${rsa.publicKeyPath}")
    public void setPublicKey(String publicKeyPath) {
        ENCRYPT_PUBLIC_KEY = cleanPemKey(loadKeyFromFile(publicKeyPath));
        log.info("rsa public key read successfully");
    }


    private static String loadKeyFromFile(String filePath) {
        InputStream inputStream = RSAUtil.class.getClassLoader().getResourceAsStream(filePath);
        if (inputStream == null) {
            log.error("rsa key file not found in resources: {}", filePath);
            throw new RuntimeException("Key file not found in resources: " + filePath);
        }
        try (InputStream is = inputStream) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[1024];
            int nRead;
            while ((nRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("load rsa key file failed: {}", filePath, e);
            throw new RuntimeException("load rsa key file failed: " + filePath, e);
        }
    }


    private static String cleanPemKey(String pemKey) {
        return pemKey.replaceAll("-----BEGIN (RSA )?(PUBLIC|PRIVATE) KEY-----", "")
                .replaceAll("-----END (RSA )?(PUBLIC|PRIVATE) KEY-----", "")
                .replaceAll("\\s+", "");
    }

    /**
     * RSA加密
     */
    public static String encrypt(String data) {
        try {
            byte[] keyBytes = Base64.decodeBase64(ENCRYPT_PUBLIC_KEY);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
            PublicKey pubKey = keyFactory.generatePublic(keySpec);

            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, pubKey);
            byte[] encryptedData = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.encodeBase64String(encryptedData);
        } catch (Exception e) {
            log.error("RSA加密失败", e);
            throw new RuntimeException("RSA加密失败", e);
        }
    }

    /**
     * RSA解密
     */
    public static String decrypt(String encryptedData) {
        try {
            byte[] keyBytes = Base64.decodeBase64(ENCRYPT_PRIVATE_KEY);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(RSA_ALGORITHM);
            PrivateKey priKey = keyFactory.generatePrivate(keySpec);

            Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, priKey);
            byte[] decodedData = Base64.decodeBase64(encryptedData);
            byte[] decryptedData = cipher.doFinal(decodedData);
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("RSA解密失败", e);
            throw new RuntimeException("RSA解密失败", e);
        }
    }
}
