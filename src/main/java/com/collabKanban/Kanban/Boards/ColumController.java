package com.collabKanban.Kanban.Boards;

import com.collabKanban.Kanban.DTO.CreateColumReq;
import com.collabKanban.Kanban.Response.ColumResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Failures are ResponseStatusExceptions thrown by ColumService (400/403/404),
// so every handler here simply returns 200 with the body.
@RestController
@RequestMapping("column")
public class ColumController {

    private final ColumService columService;

    public ColumController(ColumService columService) {
        this.columService = columService;
    }

    @PostMapping("/create")
    public ResponseEntity<ColumResponse> createsColum(@RequestBody CreateColumReq req) {
        return ResponseEntity.ok(columService.createColum(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColumResponse> getColum(@PathVariable Long id) {
        return ResponseEntity.ok(columService.getColum(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ColumResponse> deleteColum(@PathVariable Long id) {
        return ResponseEntity.ok(columService.deleteColum(id));
    }
}
