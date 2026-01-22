package com.eisoo.dc.common.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import java.io.IOException;

public class BooleanDeserializer extends JsonDeserializer<Boolean> {
    @Override
    public Boolean deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        // 获取当前token类型
        JsonToken token = parser.getCurrentToken();

        // 只接受JSON原生布尔值
        if (token == JsonToken.VALUE_TRUE) {
            return Boolean.TRUE;
        } else if (token == JsonToken.VALUE_FALSE) {
            return Boolean.FALSE;
        }else{
            throw new InvalidFormatException(parser, "Invalid boolean value", parser.getText(), Boolean.class);
        }
    }
}