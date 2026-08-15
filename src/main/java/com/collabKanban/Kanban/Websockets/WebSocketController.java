package com.collabKanban.Kanban.Websockets;

import com.collabKanban.Kanban.Card.CardService;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller

public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final CardService cardService;
    public WebSocketController(CardService cardService,SimpMessagingTemplate template) {
        messagingTemplate=template;
        this.cardService=cardService;
    }

    @MessageMapping("card/move/{cardId}")
    public MoveCardReq moveCard(@DestinationVariable Long cardId, MoveCardReq card){

        cardService.MoveCard(cardId,card);
        System.out.println("Move of card (Web Sockets is called) ");
         messagingTemplate.convertAndSend("/topic/board/"+card.getBoardId(),card);

            return card;
    }
}
