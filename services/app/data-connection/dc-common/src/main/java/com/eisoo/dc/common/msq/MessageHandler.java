package com.eisoo.dc.common.msq;

/**
 * MessageHandler unified business logic handler method
 * used by sub() {@link ProtonMQClient sub()}
 */
public interface MessageHandler {
    void handler(String msg);
}
