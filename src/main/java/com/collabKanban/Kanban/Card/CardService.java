package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.Boards.ColumRepo;
import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.DTO.MoveCardReq;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@NoArgsConstructor
public class CardService {
    private UserRepo userRepo;
    private  CardRepo cardRepo;
    private ColumRepo columRepo;
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate){ this.messagingTemplate= messagingTemplate;}
   @Autowired
   public void cardSetter(CardRepo repo){
       cardRepo=repo;
   }

   @Autowired
   public void columSetter(ColumRepo columRepo){
       this.columRepo=columRepo;
   }

   @Autowired
   public void userSetter(UserRepo repo){
       userRepo=repo;
   }

   public CardResponse createCard(CreateCardReq cardReq){
       Card card=new Card();

       CardResponse response=new CardResponse();
       Users user= cardReq.getAssignedTo()==null
                   ? null:userRepo.getReferenceById(cardReq.getAssignedTo());
       Colum column=columRepo.getReferenceById(cardReq.getColumnId());


       Card lastCard=cardRepo.findTop(column);
       Long positon=
               lastCard==null
                       ? 1000L : lastCard.getPosition()+1000;


       card.setPosition(positon);

       card.setTitle(cardReq.getTitle());


       if (user!=null) {
           card.setAssignedTo(user);

       }
       card.setDescription(cardReq.getDescription());

       card.setColum(column);

        cardRepo.save(card);

       response.setCardId(card.getCardId());
       response.setPosition(positon);
       response.setTitle(card.getTitle());
       if(user!=null){
           response.setAssignedTo(user.getUserId());
       }
       response.setDescription(card.getDescription());

   return response; }


    @Transactional
    public CardResponse MoveCard(Long cardId, MoveCardReq req){
       CardResponse res=new CardResponse();
       Card card=cardRepo.findByCardId(cardId);
       Colum column=columRepo.getReferenceById(req.getTargetColumnId());

        card.setPosition(req.getPosition());
        card.setColum(column);
        res.setTitle(card.getTitle());
        res.setCardId(card.getCardId());
        res.setAssignedTo(card.getAssignedTo() != null ? card.getAssignedTo().getUserId() : null);
        res.setPosition(card.getPosition());


       cardRepo.save(card);
       messagingTemplate.convertAndSend("/topic/board/"+card.getColum().getBoard().getBoardId(),res);
       return res;
    }

    public CardResponse getCard(Long id){
       CardResponse response=new CardResponse();
       Card card= cardRepo.findByCardId(id)==null ? null: cardRepo.findByCardId(id);


       if(card!=null){
           response.setCardId(id);
           response.setTitle(card.getTitle());
           response.setDescription(card.getDescription());
           response.setPosition(card.getPosition());
           response.setAssignedTo(card.getAssignedTo().getUserId());

       }else{
           throw new ResponseStatusException( HttpStatus.NOT_FOUND,"Card is not Found");
       }
       return response;

    }

    public CardResponse deleteCard(Long id){
       CardResponse response=new CardResponse();
       Card card=cardRepo.findByCardId(id);

       if(card!=null){
           response.setCardId(card.getCardId());
           response.setTitle(card.getTitle());
           cardRepo.deleteById(id);
           return response;
       }

       return  null;

    }

}
