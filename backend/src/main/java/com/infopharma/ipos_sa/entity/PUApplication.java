package com.infopharma.ipos_sa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pu_applications")
public class PUApplication {

    @Id
    @Column(name = "application_id", length = 30)
    private String applicationId;

    @Column(length = 20, nullable = false)
    private String type; // "commercial" or "non_commercial"

    @Column(nullable = false, length = 200)
    private String email;

    @Column(name = "submitted_at", nullable = false)
    private LocalDate submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppStatus status;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "company_house_reg", length = 100)
    private String companyHouseReg;

    @Column(name = "director_name", length = 200)
    private String directorName;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(length = 500)
    private String address;

    @Column(length = 1000)
    private String notes;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDate processedAt;

    public enum AppStatus {
        PENDING, APPROVED, REJECTED
    }
}
