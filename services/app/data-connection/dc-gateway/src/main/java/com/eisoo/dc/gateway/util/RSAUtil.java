package com.eisoo.dc.gateway.util;

import lombok.extern.slf4j.Slf4j;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Slf4j
public class RSAUtil {
    private static final String PUBLIC_KEY_PATH = "/publickey.pem";
    private static final String ALGORITHM = "RSA";
    private static final String CIPHER_EN = "RSA";
    private static String publicKeyStr;

    static {
        try {
            publicKeyStr = getPublicKeyByFile(PUBLIC_KEY_PATH);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static String encryptWithRSAPublicKey(String data) throws NoSuchPaddingException, NoSuchAlgorithmException, IOException, InvalidKeySpecException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher = Cipher.getInstance(CIPHER_EN);
        cipher.init(Cipher.ENCRYPT_MODE, getRSAPublicKey());
        byte[] encryptedData = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    public static PublicKey getRSAPublicKey() throws NoSuchAlgorithmException, InvalidKeySpecException {
        // 从文件或其他地方获取公钥字符串并转换为PublicKey对象
        byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyStr.getBytes(StandardCharsets.UTF_8));
        X509EncodedKeySpec spec = new X509EncodedKeySpec(publicKeyBytes);
        KeyFactory factory = KeyFactory.getInstance(ALGORITHM);
        return factory.generatePublic(spec);
    }

    public static String getPublicKeyByFile(String filePath) throws IOException {
        InputStream input = RSAUtil.class.getResourceAsStream(filePath);
        final ByteArrayOutputStream output = new ByteArrayOutputStream();
        int n;
        final byte[] buffer = new byte[1024 * 4];
        while (-1 != (n = input.read(buffer))) {
            output.write(buffer, 0, n);
        }
        String publicKeyPEM = output.toString()
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "");
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            publicKeyPEM = publicKeyPEM.replaceAll("\r\n", "");
        } else {
            publicKeyPEM = publicKeyPEM.replaceAll("\n", "");
        }
        log.info("os.name: " + System.getProperty("os.name"));
        log.info("RSA public key: " + publicKeyPEM);
        return publicKeyPEM;
    }
}
