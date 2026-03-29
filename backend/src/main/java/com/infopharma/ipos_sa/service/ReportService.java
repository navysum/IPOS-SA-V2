package com.infopharma.ipos_sa.service;

import com.infopharma.ipos_sa.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    TurnoverReport getTurnoverReport(LocalDate from, LocalDate to);
    MerchantOrdersSummary getMerchantOrdersSummary(Long accountId, LocalDate from, LocalDate to);
    DetailedOrderReport getMerchantDetailedOrders(Long accountId, LocalDate from, LocalDate to);
    List<com.infopharma.ipos_sa.entity.Invoice> getMerchantInvoices(Long accountId, LocalDate from, LocalDate to);
    List<com.infopharma.ipos_sa.entity.Invoice> getAllInvoices(LocalDate from, LocalDate to);
    StockTurnoverReport getStockTurnoverReport(LocalDate from, LocalDate to);
    /** Debtors whose paymentDueDate has passed — shown on-screen as reminders */
    List<DebtorReminderItem> getDebtorReminders();
}
