package com.collabKanban.Kanban.Card;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
@Component
public class CardMoveBroadcaster {

    private  final SimpMessagingTemplate msgTemplate;
    public CardMoveBroadcaster (SimpMessagingTemplate template){
        msgTemplate=template;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void broadCastEvent(CardMovedEvent event){
        msgTemplate.convertAndSend("/topic/board/" + event.boardId(), event.res());
    }
}
