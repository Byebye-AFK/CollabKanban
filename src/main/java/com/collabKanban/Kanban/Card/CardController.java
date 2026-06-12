package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("card")
public class CardController {

    private  CardService cardService;

    @Autowired
    public void cardServiceSetter(CardService service){
        cardService=service;
    }

    @PostMapping("/create")
    public ResponseEntity<Card> addCard(@RequestBody CreateCardReq request){
        Card card=cardService.createCard(request);

        if(card!=null) {
            return new ResponseEntity<>(card, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @PutMapping("/move/{cardId}")
    public ResponseEntity<Card> moveCard(@PathVariable Long cardId, @RequestBody MoveCardReq req){
        Card newCard=cardService.MoveCard(cardId,req);
        if(newCard!=null){
            return  new ResponseEntity<>(newCard,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }

}
