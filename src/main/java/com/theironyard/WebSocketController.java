package com.theironyard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Created by will on 6/30/16.
 */
@Controller
public class WebSocketController {
    static SimpMessagingTemplate messenger;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messenger) {
        this.messenger = messenger;
    }


    @MessageMapping("/move")
    @SendTo("/move")
    public Message move(Message message) {
        return message;
    }
}
