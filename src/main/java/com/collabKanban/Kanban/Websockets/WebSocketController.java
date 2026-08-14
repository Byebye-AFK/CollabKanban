package com.collabKanban.Kanban.Websockets;

import com.collabKanban.Kanban.DTO.MoveCardReq;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller

public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    public WebSocketController(SimpMessagingTemplate template) {
        messagingTemplate=template;
    }

    @MessageMapping("card/move/{cardId}")
    public MoveCardReq moveCard(MoveCardReq card){


         messagingTemplate.convertAndSend("/topic/board/"+card.getBoardId(),card);

            return card;
    }
}
