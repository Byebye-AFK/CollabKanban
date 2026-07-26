package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import com.collabKanban.Kanban.DTO.UserAuthReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/add")
    public ResponseEntity<CreateUserReq> addUser(@RequestBody CreateUserReq user){
        CreateUserReq user1= userService.addUser(user);

        return new ResponseEntity<>(user1, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{userId}")
    public  ResponseEntity<CreateUserReq> deleteUser(@PathVariable Long userId){
        CreateUserReq response = userService.deleteUser(userId);

        return new ResponseEntity<>(response
                ,HttpStatus.OK);


    }

    @PostMapping("/login")
    public  ResponseEntity<String> login(@RequestBody UserAuthReq userBody){

        String res=userService.verifyUser(userBody);

        if(res=="Failed"){
            return  new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(res,HttpStatus.OK);
    }





}
