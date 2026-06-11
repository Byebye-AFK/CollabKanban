package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateColumReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ColumService {
    ColumRepo columRepo;
    BoardRepo boardRepo;
    @Autowired
    private void setColumRepo( ColumRepo repo){
        columRepo=repo;

    }
    @Autowired
    private void setBoardRepo(BoardRepo repo){
        boardRepo=repo;
    }

    public Colum createColum(CreateColumReq req){

        Colum colum=new Colum();


        Board board=boardRepo.getReferenceById(req.getBoardId());
        Colum lastcolum= columRepo.findTop(board);
        Long position=
                lastcolum==null
                        ? 1000L
                        : lastcolum.getPosition()+1000;
        colum.setPosition(position);
        colum.setName(req.getName());
        colum.setBoard(board);
        columRepo.save(colum);

        return colum;

    }

}
