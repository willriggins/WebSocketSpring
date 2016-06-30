package com.theironyard;

import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashMap;

/**
 * Created by will on 6/30/16.
 */
@Component
public class SessionDisconnectListener implements ApplicationListener<SessionDisconnectEvent> {

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        HashMap m = new HashMap();
        m.put("id", sessionId);
        WebSocketController.messenger.convertAndSend("/remove-player", m);
    }
}
