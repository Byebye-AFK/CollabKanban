package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import com.collabKanban.Kanban.Response.CardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Thin HTTP layer. CardService throws ResponseStatusException for every
 * failure (400 / 403 / 404 / 409), so each route simply answers 200 with the body.
 */
@RestController
@RequestMapping("card")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping("/create")
    public ResponseEntity<CardResponse> addCard(@RequestBody CreateCardReq request) {
        return ResponseEntity.ok(cardService.createCard(request));
    }

    @PutMapping("/move/{cardId}")
    public ResponseEntity<CardResponse> moveCard(@PathVariable Long cardId, @RequestBody MoveCardReq req) {
        return ResponseEntity.ok(cardService.moveCard(cardId, req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CardResponse> getCard(@PathVariable Long id) {
        return ResponseEntity.ok(cardService.getCard(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CardResponse> deleteCard(@PathVariable Long id) {
        return ResponseEntity.ok(cardService.deleteCard(id));
    }
}
