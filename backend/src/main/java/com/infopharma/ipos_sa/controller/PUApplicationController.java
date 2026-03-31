package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.entity.PUApplication;
import com.infopharma.ipos_sa.repository.PUApplicationRepository;
import com.infopharma.ipos_sa.service.EmailService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pu-applications")
public class PUApplicationController {

    private final PUApplicationRepository repo;
    private final EmailService emailService;

    public PUApplicationController(PUApplicationRepository repo, EmailService emailService) {
        this.repo = repo;
        this.emailService = emailService;
    }

    // GET /api/pu-applications — list all PU commercial applications
    @GetMapping
    public ResponseEntity<List<PUApplication>> getAll() {
        return ResponseEntity.ok(repo.findAll());
    }

    // POST /api/pu-applications — submit a new application (from PU portal)
    @PostMapping
    public ResponseEntity<PUApplication> create(@RequestBody PUApplication application) {
        application.setStatus(PUApplication.AppStatus.PENDING);
        if (application.getSubmittedAt() == null) {
            application.setSubmittedAt(LocalDate.now());
        }
        return new ResponseEntity<>(repo.save(application), HttpStatus.CREATED);
    }

    // PUT /api/pu-applications/{id}/decision — approve or reject an application
    @PutMapping("/{id}/decision")
    public ResponseEntity<PUApplication> decide(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        PUApplication app = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PU Application not found: " + id));

        String statusStr = body.get("status");
        if (statusStr == null) return ResponseEntity.badRequest().build();

        PUApplication.AppStatus newStatus = PUApplication.AppStatus.valueOf(statusStr.toUpperCase());
        app.setStatus(newStatus);
        app.setNotes(body.get("notes"));
        app.setProcessedBy(body.get("processedBy"));
        app.setProcessedAt(LocalDate.now());

        PUApplication saved = repo.save(app);

        // Send outcome email via SMTP
        emailService.sendPUApplicationOutcome(
            app.getEmail(),
            app.getCompanyName() != null ? app.getCompanyName() : app.getEmail(),
            newStatus == PUApplication.AppStatus.APPROVED,
            app.getNotes()
        );

        return ResponseEntity.ok(saved);
    }
}
