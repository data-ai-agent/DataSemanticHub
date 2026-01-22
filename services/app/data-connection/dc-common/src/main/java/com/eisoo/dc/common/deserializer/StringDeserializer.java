package com.eisoo.dc.common.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import java.io.IOException;

public class StringDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        JsonToken token = parser.getCurrentToken();

        if (token == JsonToken.VALUE_NULL) {
            return null;
        }

        // 只接受JSON原生字符串值
        if (token == JsonToken.VALUE_STRING) {
            return parser.getText().trim();
        } else {
            throw new InvalidFormatException(
                    parser,
                    "Invalid string value: only accept JSON native string",
                    parser.getCurrentName(),
                    String.class
            );
        }
    }
}