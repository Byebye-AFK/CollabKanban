package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateColumReq;
import com.collabKanban.Kanban.Response.ColumResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("http://localhost:5173")
@RestController
@RequestMapping("column")
public class ColumController {
    ColumService columService;

    @Autowired
    private  void setColumService(ColumService service){
        columService=service;
    }

    @PostMapping("/create")
    public ResponseEntity<ColumResponse> createsColum(@RequestBody CreateColumReq req){
        ColumResponse colum= columService.createColum(req);

        if(colum!=null){
            return new ResponseEntity<>(colum, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColumResponse> getColum(@PathVariable Long id){
        ColumResponse response= columService.getColum(id);

        if(response!=null){

            return new ResponseEntity<>(response,HttpStatus.OK);
        }


        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ColumResponse> deleteColum(@PathVariable Long id){
        System.out.println("Delete column");
        ColumResponse response= columService.deleteColum(id);

        if(response!=null){
            return  new ResponseEntity<>(response,HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
