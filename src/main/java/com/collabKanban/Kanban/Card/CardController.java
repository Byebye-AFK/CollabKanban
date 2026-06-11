package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.DTO.CreateCardReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
