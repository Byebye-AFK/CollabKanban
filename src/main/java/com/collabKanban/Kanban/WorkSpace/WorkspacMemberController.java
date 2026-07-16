package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.AddWorkspaceMember;
import com.collabKanban.Kanban.Response.RoleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/member")
public class WorkspacMemberController {

    WorkspaceMemberService memberService;

    public WorkspacMemberController(WorkspaceMemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping("/addmembership")
    public ResponseEntity<RoleResponse> addMemberships(@RequestBody AddWorkspaceMember memberDto){
        RoleResponse response=memberService.addMembership(memberDto.getWorkSpaceId(), memberDto.getUserId(), memberDto.getRole());


        return new ResponseEntity<>(response , HttpStatus.OK);


    }


}
