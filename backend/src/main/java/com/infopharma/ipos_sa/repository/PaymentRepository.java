package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.Payment;
import com.infopharma.ipos_sa.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByAccount(UserAccount account);
}
