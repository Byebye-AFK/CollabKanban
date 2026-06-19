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
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class CardService {
    private UserRepo userRepo;
    private  CardRepo cardRepo;
    private ColumRepo columRepo;
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
       System.out.println(" ");
       System.out.println("Called Create Card");
       System.out.println(" ");
       System.out.println("userId: "+cardReq.getAssignedTo());
       CardResponse response=new CardResponse();
       Users user=userRepo.getReferenceById(cardReq.getAssignedTo());
       Colum column=columRepo.getReferenceById(cardReq.getColumnId());


       Card lastCard=cardRepo.findTop(column);
       Long positon=
               lastCard==null
                       ? 1000L : lastCard.getPosition()+1000;


       card.setPosition(positon);
       response.setPosition(positon);
       card.setTitle(cardReq.getTitle());
       response.setTitle(card.getTitle());
       card.setAssignedTo(user);
       response.setAssignedTo(user.getUserId());
       response.setCardId(card.getCardId());

       card.setDescription(cardReq.getDescription());
       response.setDescription(card.getDescription());
       card.setColum(column);

        cardRepo.save(card);


   return response; }

    public CardResponse MoveCard(Long cardId, MoveCardReq req){
       CardResponse res=new CardResponse();
        System.out.println("-------Moving Card-------");
       Card card=cardRepo.getReferenceById(cardId);
       Colum column=columRepo.getReferenceById(req.getTargetColumnId());

       card.setPosition(req.getPosition());
       card.setColum(column);
        res.setTitle(card.getTitle());
        res.setCardId(card.getCardId());
        res.setAssignedTo(card.getAssignedTo().getUserId());
        res.setPosition(card.getPosition());


       cardRepo.save(card);

       return res;
    }

    public CardResponse getCard(Long id){
       CardResponse response=new CardResponse();
       Card card=cardRepo.getReferenceById(id);


       response.setCardId(id);
       response.setTitle(card.getTitle());
       response.setDescription(card.getDescription());
       response.setPosition(card.getPosition());
       response.setAssignedTo(card.getAssignedTo().getUserId());

       return response;

    }

    public CardResponse deleteCard(Long id){
       CardResponse response=new CardResponse();
       Card card=cardRepo.getReferenceById(id);

       if(card!=null){
           response.setCardId(card.getCardId());
           response.setTitle(card.getTitle());
           cardRepo.deleteById(id);
           return response;
       }

       return  null;

    }

}
