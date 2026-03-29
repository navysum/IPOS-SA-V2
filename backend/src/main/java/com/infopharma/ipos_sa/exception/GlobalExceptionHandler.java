package com.infopharma.ipos_sa.exception;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> notFound(EntityNotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> badState(IllegalStateException e) {
        return ResponseEntity.status(400).body(e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> badArg(IllegalArgumentException e) {
        return ResponseEntity.status(400).body(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> general(Exception e) {
        return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
    }
}
