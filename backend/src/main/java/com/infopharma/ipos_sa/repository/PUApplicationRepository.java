package com.infopharma.ipos_sa.repository;

import com.infopharma.ipos_sa.entity.PUApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PUApplicationRepository extends JpaRepository<PUApplication, String> {
}
