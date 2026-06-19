package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import com.collabKanban.Kanban.Response.CardResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("http://localhost:5173")
@RestController
@RequestMapping("card")
public class CardController {

    private  CardService cardService;

    @Autowired
    public void cardServiceSetter(CardService service){
        cardService=service;
    }

    @PostMapping("/create")
    public ResponseEntity<CardResponse> addCard(@RequestBody CreateCardReq request){
        CardResponse card=cardService.createCard(request);

        if(card!=null) {
            return new ResponseEntity<>(card, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @PutMapping("/move/{cardId}")
    public ResponseEntity<CardResponse> moveCard(@PathVariable Long cardId, @RequestBody MoveCardReq req){
        CardResponse newResponse=cardService.MoveCard(cardId,req);
        if(newResponse!=null){
            return  new ResponseEntity<>(newResponse,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }

    @GetMapping("/{id}")
    public ResponseEntity<CardResponse> getCard(@PathVariable Long id){
        CardResponse response= cardService.getCard(id);

        if(response!=null){
            return new ResponseEntity<>(response,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }
    @DeleteMapping("/{id}")
    public ResponseEntity<CardResponse> deleteCard(@PathVariable Long id){
        CardResponse response= cardService.deleteCard(id);
        if(response!=null){
            return  new ResponseEntity<>(response,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
