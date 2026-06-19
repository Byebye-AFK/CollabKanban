package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.Card.Card;
import com.collabKanban.Kanban.Card.CardRepo;
import com.collabKanban.Kanban.DTO.CreateColumReq;
import com.collabKanban.Kanban.Response.CardResponse;
import com.collabKanban.Kanban.Response.ColumResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@Service
public class ColumService {
    ColumRepo columRepo;
    BoardRepo boardRepo;
    CardRepo cardRepo;
    @Autowired
    private void setColumRepo( ColumRepo repo){
        columRepo=repo;

    }
    @Autowired
    private void setBoardRepo(BoardRepo repo){
        boardRepo=repo;
    }

    @Autowired
    private void setCardRepo(CardRepo repo){ cardRepo=repo;}

    public ColumResponse createColum(CreateColumReq req){

        Colum colum=new Colum();
        ColumResponse response=new ColumResponse();

        Board board=boardRepo.getReferenceById(req.getBoardId());
        Colum lastcolum= columRepo.findTop(board);
        Long position=
                lastcolum==null
                        ? 1000L
                        : lastcolum.getPosition()+1000;
        colum.setPosition(position);
        colum.setName(req.getName());
        colum.setBoard(board);
        response.setColumnId(colum.getColumnId());
        response.setName(colum.getName());
        columRepo.save(colum);

        return response;

    }

    public ColumResponse getColum(Long id){
        ColumResponse response=new ColumResponse();
        Colum column=columRepo.getReferenceById(id);

        List<CardResponse> cards=column.getCards().stream().map(card -> {CardResponse response1=new CardResponse();
                                                                                response1.setCardId(card.getCardId());
                                                                                response1.setTitle(card.getTitle());
                                                                                response1.setDescription(card.getDescription());
                                                                                response1.setPosition(card.getPosition());
                                                                                return response1;
        } ).toList();

        response.setName(column.getName());
        response.setCards(cards);
        response.setColumnId(id);

        return response;


    }


    public ColumResponse deleteColum(Long id){
        ColumResponse response=new ColumResponse();
        Colum column=columRepo.getReferenceById(id);
        response.setName(column.getName());
        response.setColumnId(column.getColumnId());

        columRepo.deleteById(id);
        return response;

    }

}
