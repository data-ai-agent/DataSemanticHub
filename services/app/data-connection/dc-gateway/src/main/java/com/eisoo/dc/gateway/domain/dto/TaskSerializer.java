package com.eisoo.dc.gateway.domain.dto;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

public class TaskSerializer extends JsonSerializer<TaskQuery> {
    @Override
    public void serialize(TaskQuery value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeStartObject();
        gen.writeStringField("task_id", value.getTaskId());
        gen.writeStringField("state", value.getState());
        gen.writeStringField("progress", value.getProgress());
        gen.writeEndObject();
    }
}
