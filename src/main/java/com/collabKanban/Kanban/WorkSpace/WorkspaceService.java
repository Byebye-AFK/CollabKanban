package com.collabKanban.Kanban.WorkSpace;

import com.collabKanban.Kanban.Boards.Board;
import com.collabKanban.Kanban.Boards.BoardService;
import com.collabKanban.Kanban.DTO.CreateWorkspaceReq;
import com.collabKanban.Kanban.Response.BoardResponse;
import com.collabKanban.Kanban.Response.TeamResponse;
import com.collabKanban.Kanban.Response.UserResponse;
import com.collabKanban.Kanban.Response.WorkSpaceResponse;
import com.collabKanban.Kanban.Team.Team;
import com.collabKanban.Kanban.UserSpace.UserRepo;
import com.collabKanban.Kanban.UserSpace.Users;
import com.collabKanban.Kanban.authentication.JwtService;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static java.util.stream.Collectors.toList;

@Service
public class WorkspaceService {
    WorkspaceRepo workspaceRepo;
    UserRepo userRepo;
    WorkspaceMemberRepo workspaceMemberRepo;

    BoardService boardService;
    JwtService jwtService;

    @Autowired
    private void setServices(BoardService boardService,JwtService service){
        jwtService=service;
        this.boardService=boardService;
    }

    @Autowired
    private void setWorkspaceUserRepos(WorkspaceRepo repo,UserRepo userRepo,WorkspaceMemberRepo workspaceMemberRepo){
        workspaceRepo=repo;
        this.userRepo=userRepo;
        this.workspaceMemberRepo=workspaceMemberRepo;
    }

    public Workspace createWorkspace(CreateWorkspaceReq req){
        Workspace workspace=new Workspace();
        workspace.setName(req.getName());
        workspaceRepo.save(workspace);

        return workspace;
    }

    public List<WorkSpaceResponse> getMyWorkspaces(String token){
        Users user=userRepo.findByemail(jwtService.extractUserName(token));

        List<WorkSpaceResponse> workspaces= workspaceMemberRepo.findWorkspacesUserBelong(user).stream().map(
                (Workspace workspace)->{
                    WorkSpaceResponse workSpaceResponse=new WorkSpaceResponse();

                    List<BoardResponse> boards=workspace.getBoards().stream().map((Board board)->{return boardService.findBoards(board.getBoardId());}).toList();
                    workSpaceResponse.setBoards(boards);

                    List<UserResponse> users= workspaceMemberRepo.findMembersnWorkspaceExceptUser(workspace,user).stream().map( (Users users1)->{
                                      UserResponse response =new UserResponse();

                                      response.setUserName( users1.getName() );
                                      response.setUserEmail( users1.getEmail() );

                                      return  response;
                            } )
                            .toList();
                    workSpaceResponse.setMembers(users);

                    List<TeamResponse> teams=workspace.teamsBworkspace.stream().map((Team team)->{

                                           TeamResponse response=new TeamResponse();
                                           response.setTeamName(team.getName());
                                           response.setCount(team.getCount());

                                            return response;     })
                                           .toList();

                   workSpaceResponse.setTeams(teams);

                   workSpaceResponse.setRole(workspaceMemberRepo.getRoleOfMember(user,workspace));
                   workSpaceResponse.setName(workspace.getName());




                return  workSpaceResponse;}
        ).toList();



    return  workspaces;

    }


}
