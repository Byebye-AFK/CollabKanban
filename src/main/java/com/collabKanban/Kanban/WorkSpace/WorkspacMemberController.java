package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.DTO.AddWorkspaceMember;
import com.collabKanban.Kanban.Response.RoleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/member")
public class WorkspacMemberController {

    private final WorkspaceMemberService memberService;

    public WorkspacMemberController(WorkspaceMemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping("/addmembership")
    public ResponseEntity<RoleResponse> addMemberships(@RequestBody AddWorkspaceMember memberDto) {
        if (memberDto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "workSpaceId, userId and role are required");
        }
        return ResponseEntity.ok(
                memberService.addMembership(memberDto.getWorkSpaceId(), memberDto.getUserId(), memberDto.getRole()));
    }
}
