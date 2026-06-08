package com.collabKanban.Kanban.UserSpace;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("user")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<Users> addUser(@RequestBody Users user){
        Users user1= userService.addUser(user);

        return new ResponseEntity<>(user1, HttpStatus.OK);
    }


}
