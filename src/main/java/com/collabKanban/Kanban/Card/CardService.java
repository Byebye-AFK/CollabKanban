package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Boards.Colum;
import com.collabKanban.Kanban.Boards.ColumRepo;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class CardService {

   private  CardRepo cardRepo;

   private ColumRepo columRepo;

   private UserRepo userRepo;

   public Card createCard(CreateCardReq cardReq){
       Card card=new Card();
       Users user=userRepo.findByuserId(cardReq.getAssignedTo());
       Colum column=columRepo.getReferenceById(cardReq.getColumnId());
       card.setTitle(cardReq.getTitle());
       card.setAssignedTo(user);
       card.setDescription(cardReq.getDescription());
       card.setColum(column);


   return card; }
}
