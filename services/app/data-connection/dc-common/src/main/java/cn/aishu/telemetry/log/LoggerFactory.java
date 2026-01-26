package cn.aishu.telemetry.log;

import java.lang.Class;

/**
 * 爱数内部LoggerFactory的替代实现，用于编译兼容
 */
public class LoggerFactory {
    public static Logger getLogger(Class<?> clazz) {
        return new DefaultLogger();
    }
    
    private static class DefaultLogger implements Logger {
        @Override
        public void trace(String message, Attributes attributes, Link link, Service service) {
            System.out.println("TRACE: " + message);
        }

        @Override
        public void debug(String message, Attributes attributes, Link link, Service service) {
            System.out.println("DEBUG: " + message);
        }

        @Override
        public void info(String message, Attributes attributes, Link link, Service service) {
            System.out.println("INFO: " + message);
        }

        @Override
        public void warn(String message, Attributes attributes, Link link, Service service) {
            System.out.println("WARN: " + message);
        }

        @Override
        public void error(String message, Attributes attributes, Link link, Service service) {
            System.out.println("ERROR: " + message);
        }
    }
}