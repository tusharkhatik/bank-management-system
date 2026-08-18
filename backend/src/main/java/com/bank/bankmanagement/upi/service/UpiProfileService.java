package com.bank.bankmanagement.upi.service;

import com.bank.bankmanagement.upi.dto.CreateUpiProfileRequest;
import com.bank.bankmanagement.upi.model.UpiProfile;
import com.bank.bankmanagement.upi.repository.UpiProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class UpiProfileService {

    private final UpiProfileRepository upiProfileRepository;

    public UpiProfileService(UpiProfileRepository upiProfileRepository) {
        this.upiProfileRepository = upiProfileRepository;
    }

    public UpiProfile createProfile(CreateUpiProfileRequest request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request body is required"
            );
        }

        if (request.getUpiId() == null || request.getUpiId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "UPI ID is required"
            );
        }

        if (request.getDisplayName() == null ||
                request.getDisplayName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Display name is required"
            );
        }

        if (request.getAccountId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Account ID is required"
            );
        }

        String upiId = request.getUpiId()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!upiId.matches(
                "^[a-z0-9._-]{2,50}@[a-z0-9.-]{2,30}$"
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid UPI ID format"
            );
        }

        if (upiProfileRepository.existsByUpiId(upiId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "UPI ID already exists"
            );
        }

        if (upiProfileRepository.existsByAccountId(
                request.getAccountId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
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

        if (upiId == null || upiId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "UPI ID is required"
            );
        }

        String normalizedUpiId = upiId
                .trim()
                .toLowerCase(Locale.ROOT);

        return upiProfileRepository
                .findByUpiId(normalizedUpiId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "UPI ID not found: " + normalizedUpiId
                        )
                );
    }

    public UpiProfile getByAccountId(Long accountId) {

        if (accountId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Account ID is required"
            );
        }

        return upiProfileRepository
                .findByAccountId(accountId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "UPI profile not found"
                        )
                );
    }

    public UpiProfile updateStatus(Long id, boolean active) {

        if (id == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Profile ID is required"
            );
        }

        UpiProfile profile = upiProfileRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "UPI profile not found"
                        )
                );

        profile.setActive(active);

        return upiProfileRepository.save(profile);
    }
}
