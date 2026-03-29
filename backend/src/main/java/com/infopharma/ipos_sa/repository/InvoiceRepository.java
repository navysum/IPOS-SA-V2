package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.Invoice;
import com.infopharma.ipos_sa.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    List<Invoice> findByAccount(UserAccount account);
    List<Invoice> findByAccountAndInvoiceDateBetween(UserAccount account, LocalDate from, LocalDate to);
    List<Invoice> findByInvoiceDateBetween(LocalDate from, LocalDate to);
}
