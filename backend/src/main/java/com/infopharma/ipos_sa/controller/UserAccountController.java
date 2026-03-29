package com.infopharma.ipos_sa.controller;

import com.infopharma.ipos_sa.dto.*;
import com.infopharma.ipos_sa.entity.UserAccount;
import com.infopharma.ipos_sa.mapper.Mapper;
import com.infopharma.ipos_sa.service.ReportService;
import com.infopharma.ipos_sa.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/accounts")
public class UserAccountController {

    private final Mapper<UserAccount, CreateUserAccountRequest> userAccountMapper;
    private final Mapper<UserAccount, UpdateMerchantAccountRequest> updateMerchantMapper;
    private final Mapper<UserAccount, UpdateAccountDetailsRequest> updateAccountDetailsMapper;
    private final UserService userService;
    private final ReportService reportService;
    private final ModelMapper modelMapper; // used only for in-place partial-update (map into existing entity)

    public UserAccountController(
            Mapper<UserAccount, CreateUserAccountRequest> userAccountMapper,
            Mapper<UserAccount, UpdateMerchantAccountRequest> updateMerchantMapper,
            Mapper<UserAccount, UpdateAccountDetailsRequest> updateAccountDetailsMapper,
            UserService userService,
            ReportService reportService,
            ModelMapper modelMapper) {
        this.userAccountMapper = userAccountMapper;
        this.updateMerchantMapper = updateMerchantMapper;
        this.updateAccountDetailsMapper = updateAccountDetailsMapper;
        this.userService = userService;
        this.reportService = reportService;
        this.modelMapper = modelMapper;
    }

    // POST /api/accounts — create user or merchant account
    @PostMapping
    public ResponseEntity<UserAccount> createAccount(
            @RequestBody CreateUserAccountRequest request) {
        UserAccount userAccount = userAccountMapper.mapFrom(request);
        UserAccount saved = userService.createAccount(userAccount);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // GET /api/accounts — list all accounts
    @GetMapping
    public ResponseEntity<List<UserAccount>> getAllAccounts() {
        return ResponseEntity.ok(userService.findAll());
    }

    // GET /api/accounts/{id} — get one account (includes overdue reminders if merchant)
    @GetMapping("/{id}")
    public ResponseEntity<UserAccount> getAccount(@PathVariable Long id) {
        return userService.findOne(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/accounts/{id}/balance — get current balance
    @GetMapping("/{id}/balance")
    public ResponseEntity<?> getBalance(@PathVariable Long id) {
        Optional<UserAccount> found = userService.findOne(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
                java.util.Map.of("accountId", id, "balance", found.get().getBalance()));
    }

    // PUT /api/accounts/{id}/details — change role or status (promote/demote)
    @PutMapping("/{id}/details")
    public ResponseEntity<UpdateAccountDetailsRequest> updateAccountDetails(
            @PathVariable Long id,
            @RequestBody UpdateAccountDetailsRequest request) {
        Optional<UserAccount> found = userService.findOne(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        UserAccount account = found.get();
        modelMapper.map(request, account); // skip-null: only overwrites fields present in request

        UserAccount updated = userService.updateAccount(account);
        return ResponseEntity.ok(updateAccountDetailsMapper.mapTo(updated));
    }

    // PUT /api/accounts/{id} — modify merchant contact info
    @PutMapping("/{id}")
    public ResponseEntity<UpdateMerchantAccountRequest> updateMerchantAccount(
            @PathVariable Long id,
            @RequestBody UpdateMerchantAccountRequest request) {
        Optional<UserAccount> found = userService.findOne(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        UserAccount account = found.get();
        modelMapper.map(request, account); // skip-null: only overwrites fields present in request

        UserAccount updated = userService.updateAccount(account);
        return ResponseEntity.ok(updateMerchantMapper.mapTo(updated));
    }

    // PUT /api/accounts/{id}/credit-limit — set or change credit limit
    @PutMapping("/{id}/credit-limit")
    public ResponseEntity<?> updateCreditLimit(
            @PathVariable Long id,
            @RequestBody UpdateCreditLimitRequest request) {
        try {
            UserAccount updated = userService.updateCreditLimit(id, request.getCreditLimit());
            return ResponseEntity.ok(
                    java.util.Map.of("accountId", id, "creditLimit", updated.getCreditLimit()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PUT /api/accounts/{id}/discount-plan — assign a discount plan
    @PutMapping("/{id}/discount-plan")
    public ResponseEntity<?> assignDiscountPlan(
            @PathVariable Long id,
            @RequestBody UpdateDiscountPlanAssignRequest request) {
        try {
            userService.updateDiscountPlan(id, request.getDiscountPlanId());
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PUT /api/accounts/{id}/status — restore account to NORMAL (manager action)
    @PutMapping("/{id}/status")
    public ResponseEntity<UpdateAccountDetailsRequest> restoreAccountStatus(
            @PathVariable Long id,
            @RequestBody(required = false) UpdateAccountDetailsRequest request) {
        Optional<UserAccount> found = userService.findOne(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();

        UserAccount account = found.get();
        // If a specific status is sent use it, otherwise default to NORMAL
        account.setAccountStatus(
                (request != null && request.getAccountStatus() != null)
                        ? request.getAccountStatus()
                        : UserAccount.AccountStatus.NORMAL);
        UserAccount updated = userService.updateAccount(account);
        return ResponseEntity.ok(updateAccountDetailsMapper.mapTo(updated));
    }

    // DELETE /api/accounts/{id} — delete account with cascade
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        if (userService.findOne(id).isEmpty()) return ResponseEntity.notFound().build();
        userService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/accounts/debtors — on-screen reminders for overdue merchants
    @GetMapping("/debtors")
    public ResponseEntity<List<DebtorReminderItem>> getDebtorReminders() {
        return ResponseEntity.ok(reportService.getDebtorReminders());
    }
}
