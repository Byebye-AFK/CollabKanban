package com.collabKanban.Kanban.UserSpace;

import com.collabKanban.Kanban.DTO.CreateUserReq;
import com.collabKanban.Kanban.DTO.UserAuthReq;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Public. Returns the account without its password. */
    @PostMapping("/add")
    public ResponseEntity<CreateUserReq> addUser(@RequestBody CreateUserReq user) {
        return ResponseEntity.ok(userService.addUser(user));
    }

    /** Needs a token; a caller may delete only their own account. */
    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<CreateUserReq> deleteUser(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.deleteUser(userId));
    }

    /** Public. 200 with the JWT; wrong credentials surface as 401 from the service. */
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserAuthReq userBody) {
        return ResponseEntity.ok(userService.verifyUser(userBody));
    }
}
