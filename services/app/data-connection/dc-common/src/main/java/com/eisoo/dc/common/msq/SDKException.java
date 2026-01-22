package com.eisoo.dc.common.msq;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public class SDKException extends RuntimeException {
    // static internal class
    public static class ConfigInvalidException extends RuntimeException {

        public ConfigInvalidException(String message) {
            super(message);
        }
    }

    public static class ClientException extends RuntimeException {
        public ClientException(String message) {
            super(message);
        }
    }

    public static class ParseConfigFileException extends RuntimeException {
        public ParseConfigFileException(String message) {
            super(message);
        }
    }

    public static class HanderException extends RuntimeException {
        public HanderException(String message) {
            super(message);
        }
    }
}