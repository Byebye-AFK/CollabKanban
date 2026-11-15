package com.collabKanban.Kanban.Errors;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * Turns persistence failures that the client can recover from into proper
 * status codes. The body has the same shape as Spring's default error JSON
 * ({timestamp, status, error, message, path}), so the frontend's
 * parseApiError() reads it without changes.
 *
 * Deliberately no catch-all Exception handler: it would swallow the
 * ResponseStatusExceptions (403 / 404 / 409) that the services already throw.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Someone else committed a change to the same row first (@Version
     * mismatch at flush). OptimisticLockingFailureException is the parent of
     * ObjectOptimisticLockingFailureException, so both are covered.
     *
     * This is one of two sources of a 409 on a card move. The other is the
     * explicit version check in CardService, which throws
     * ResponseStatusException(CONFLICT) when the client's version is stale;
     * that one never reaches this handler. The frontend answers either 409
     * by resyncing the board.
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleStaleWrite(
            OptimisticLockingFailureException ex, HttpServletRequest request) {
        log.debug("Optimistic lock conflict on {}", request.getRequestURI(), ex);
        return error(HttpStatus.CONFLICT,
                "Someone else changed this card first. Reload and try again.", request);
    }

    /** A getReferenceById() proxy pointed at a row that does not exist. */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleMissingEntity(
            EntityNotFoundException ex, HttpServletRequest request) {
        log.debug("Missing entity on {}", request.getRequestURI(), ex);
        return error(HttpStatus.NOT_FOUND, "That item no longer exists.", request);
    }

    private static ResponseEntity<Map<String, Object>> error(
            HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        log.debug("Constraint violation on {}", request.getRequestURI(), ex);
        return error(HttpStatus.CONFLICT, "That already exists.", request);
    }


}
