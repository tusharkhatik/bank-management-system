package com.bank.bankmanagement.upi.service;

import com.bank.bankmanagement.upi.dto.CreateUpiProfileRequest;
import com.bank.bankmanagement.upi.model.UpiProfile;
import com.bank.bankmanagement.upi.repository.UpiProfileRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class UpiProfileService {

    private final UpiProfileRepository upiProfileRepository;

    public UpiProfileService(UpiProfileRepository upiProfileRepository) {
        this.upiProfileRepository = upiProfileRepository;
    }

    public UpiProfile createProfile(CreateUpiProfileRequest request) {

        if (request.getUpiId() == null || request.getUpiId().isBlank()) {
            throw new IllegalArgumentException("UPI ID is required");
        }

        if (request.getDisplayName() == null || request.getDisplayName().isBlank()) {
            throw new IllegalArgumentException("Display name is required");
        }

        if (request.getAccountId() == null) {
            throw new IllegalArgumentException("Account ID is required");
        }

        String upiId = request.getUpiId()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!upiId.matches("^[a-z0-9._-]{2,50}@[a-z0-9.-]{2,30}$")) {
            throw new IllegalArgumentException("Invalid UPI ID format");
        }

        if (upiProfileRepository.existsByUpiId(upiId)) {
            throw new IllegalArgumentException("UPI ID already exists");
        }

        if (upiProfileRepository.existsByAccountId(request.getAccountId())) {
            throw new IllegalArgumentException(
                    "This account already has a UPI profile"
            );
        }

        UpiProfile profile = new UpiProfile(
                upiId,
                request.getDisplayName().trim(),
                request.getAccountId()
        );

        return upiProfileRepository.save(profile);
    }

    public UpiProfile getByUpiId(String upiId) {

        return upiProfileRepository.findByUpiId(
                upiId.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(
                () -> new IllegalArgumentException("UPI ID not found")
        );
    }

    public UpiProfile getByAccountId(Long accountId) {

        return upiProfileRepository.findByAccountId(accountId)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "UPI profile not found"
                        )
                );
    }

    public UpiProfile updateStatus(Long id, boolean active) {

        UpiProfile profile = upiProfileRepository.findById(id)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "UPI profile not found"
                        )
                );

        profile.setActive(active);

        return upiProfileRepository.save(profile);
    }
}
