package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.Boards.ColumRepo;
import com.collabKanban.Kanban.DTO.CreateCardReq;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class CardService {


   private  CardRepo cardRepo;
   @Autowired
   public void cardSetter(CardRepo repo){
       cardRepo=repo;
   }

   private ColumRepo columRepo;
   @Autowired
   public void columSetter(ColumRepo columRepo){
       this.columRepo=columRepo;
   }

   private UserRepo userRepo;
   @Autowired
   public void userSetter(UserRepo repo){
       userRepo=repo;
   }

   public Card createCard(CreateCardReq cardReq){
       Card card=new Card();

       Users user=userRepo.getReferenceById(cardReq.getAssignedTo());
       Colum column=columRepo.getReferenceById(cardReq.getColumnId());

       Card lastCard=cardRepo.findTop(column);
       Long positon=
               lastCard==null
                       ? 1000L : lastCard.getPosition()+1000;


       card.setPosition(positon);
       card.setTitle(cardReq.getTitle());
       card.setAssignedTo(user);
       card.setDescription(cardReq.getDescription());
       card.setColum(column);



   return cardRepo.save(card); }
}
