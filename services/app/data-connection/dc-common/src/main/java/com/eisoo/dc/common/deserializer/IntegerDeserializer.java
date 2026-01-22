package com.eisoo.dc.common.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import java.io.IOException;

public class IntegerDeserializer extends JsonDeserializer<Integer> {

    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        // 获取当前token类型
        JsonToken token = parser.getCurrentToken();

        if (token == JsonToken.VALUE_NULL) {
            return 0;
        }

        // 只接受JSON原生整数值
        if (token == JsonToken.VALUE_NUMBER_INT) {
            return parser.getIntValue();
        } else {
            throw new InvalidFormatException(
                    parser,
                    "Invalid integer value: only accept JSON native integer",
                    parser.getCurrentName(),
                    Integer.class
            );
        }
    }
}
