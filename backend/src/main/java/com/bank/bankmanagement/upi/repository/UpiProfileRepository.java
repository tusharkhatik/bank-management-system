package com.bank.bankmanagement.upi.repository;

import com.bank.bankmanagement.upi.model.UpiProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UpiProfileRepository extends JpaRepository<UpiProfile, Long> {

    Optional<UpiProfile> findByUpiId(String upiId);

    Optional<UpiProfile> findByAccount_Id(Long accountId);

    boolean existsByUpiId(String upiId);

    boolean existsByAccount_Id(Long accountId);
}
