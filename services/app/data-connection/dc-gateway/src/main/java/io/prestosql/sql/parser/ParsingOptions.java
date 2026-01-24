package io.prestosql.sql.parser;

public class ParsingOptions {
    public enum DecimalLiteralTreatment {
        AS_DOUBLE, AS_DECIMAL
    }
    
    public ParsingOptions(DecimalLiteralTreatment decimalLiteralTreatment) {
        // 构造函数
    }
    
    public static class Builder {
        public static Builder builder() {
            return new Builder();
        }
        
        public Builder setDecimalLiteralTreatment(DecimalLiteralTreatment treatment) {
            return this;
        }
        
        public ParsingOptions build() {
            return new ParsingOptions(DecimalLiteralTreatment.AS_DOUBLE);
        }
    }
}