package com.eisoo.dc.gateway.util;

import cn.hutool.crypto.digest.DigestUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.eisoo.dc.gateway.domain.vo.QueryEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @Author zdh
 **/
public class CommonUtil {
    private static final Logger log = LoggerFactory.getLogger(CommonUtil.class);

    public static JSONObject loadHiveNoKrbProperties() {
        JSONObject config = JSONUtil.parseObj(PropertyUtils.getPrefixedHiveProperties("olk"));
        return config;
    }

    /**
     * 加载krb认证相关配置
     *
     * @return
     */
    public static JSONObject loadHiveKrbProperties() {
        return JSONUtil.parseObj(PropertyUtils.getPrefixedHiveProperties("krb"));
    }


    /**
     * 文件内容替换
     *
     * @param filepath
     * @param sourceStr
     * @param targetStr
     * @return
     */
    public static boolean replaceFileStr(String filepath, String sourceStr, String targetStr) {
        try {
            log.info("开始替换hosts为ip......");
            FileReader fis = new FileReader(filepath);
            char[] data = new char[1024];
            int rn = 0;
            StringBuilder sb = new StringBuilder();
            // 错误或者已到达流的末尾前，此方法一直阻塞。读取的字符数，如果已到达流的末尾，则返回 -1
            while ((rn = fis.read(data)) > 0) {
                String str = String.valueOf(data, 0, rn);
                sb.append(str);
            }
            fis.close();// 关闭输入流
            // 从构建器中生成字符串，并替换搜索文本
            String str = sb.toString().replace(sourceStr, targetStr);
            FileWriter fout = new FileWriter(filepath);
            fout.write(str.toCharArray());
            fout.close();// 关闭输出流
            return true;
        } catch (FileNotFoundException e) {
            log.error("文件不存在", e);
            return false;
        } catch (IOException e) {
            log.error("修改文件内容失败!", e);
            return false;
        }
    }

    /**
     * 进行敏感数据加密操作
     *
     * @return
     */
    public static String crypto(String str) {
        return DigestUtil.md5Hex(str);
    }

    public static String convertListToJson(List<QueryEntity> jsonData) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        ConcurrentHashMap<String, Object> jsonObject = new ConcurrentHashMap<>();
        if (jsonData == null || jsonData.isEmpty()) {
            jsonObject.put("columns", ConcurrentHashMap.newKeySet());
            jsonObject.put("data", ConcurrentHashMap.newKeySet());
            jsonObject.put("total_count", 0);
            return objectMapper.writeValueAsString(jsonObject);
        }

        List<Map<String, String>> columns = jsonData.get(0).getColumns(); // 从第一个元素获取columns
        List<List<Object>> allData = new ArrayList<>();
        int totalCount = 0;

        for (QueryEntity dataElement : jsonData) {
            if (dataElement != null) {
                List<List<Object>> data = dataElement.getData();
                if (data != null && !data.isEmpty()) {
                    allData.addAll(data);
                    totalCount += data.size();
                }
            }
        }

        if (columns != null && !columns.isEmpty()) {
            jsonObject.put("columns", columns);

            if (!allData.isEmpty()) {
                jsonObject.put("data", allData);
                jsonObject.put("total_count", totalCount);
            } else {
                jsonObject.put("data", new ArrayList<>());
                jsonObject.put("total_count", 0);
            }
        }

        try {
            return objectMapper.writeValueAsString(jsonObject);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public static String getUrl(String protocol, String host, String port) {
        return protocol + "://" + host + ":" + port;
    }

}
