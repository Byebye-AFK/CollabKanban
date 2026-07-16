package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
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







}
