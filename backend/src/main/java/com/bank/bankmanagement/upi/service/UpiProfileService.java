package com.bank.bankmanagement.upi.service;

import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.repository.AccountRepository;
import com.bank.bankmanagement.upi.dto.CreateUpiProfileRequest;
import com.bank.bankmanagement.upi.model.UpiProfile;
import com.bank.bankmanagement.upi.repository.UpiProfileRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class UpiProfileService {

    private final UpiProfileRepository upiProfileRepository;
    private final AccountRepository accountRepository;

    public UpiProfileService(
            UpiProfileRepository upiProfileRepository,
            AccountRepository accountRepository) {

        this.upiProfileRepository = upiProfileRepository;
        this.accountRepository = accountRepository;
    }

    // =========================================================
    // CURRENT AUTHENTICATED USER
    // =========================================================

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication.getName() == null ||
                authentication.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return authentication.getName();
    }

    // =========================================================
    // CREATE UPI PROFILE
    // =========================================================

    public UpiProfile createProfile(
            CreateUpiProfileRequest request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request body is required"
            );
        }

        if (request.getUpiId() == null ||
                request.getUpiId().isBlank()) {

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

        String username = getCurrentUsername();

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

        // -----------------------------------------------------
        // UPI ID must be globally unique
        // -----------------------------------------------------

        if (upiProfileRepository.existsByUpiId(upiId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "UPI ID already exists"
            );
        }

        // -----------------------------------------------------
        // Account must belong to authenticated user
        // -----------------------------------------------------

        Account account =
                accountRepository
                        .findByIdAndOwnerUsername(
                                request.getAccountId(),
                                username
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You do not own this account"
                                )
                        );

        // -----------------------------------------------------
        // Account can have only one UPI profile
        // -----------------------------------------------------

        if (upiProfileRepository.existsByAccount_Id(
                account.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This account already has a UPI profile"
            );
        }

        UpiProfile profile = new UpiProfile(
                upiId,
                request.getDisplayName().trim(),
                account
        );

        return upiProfileRepository.save(profile);
    }

    // =========================================================
    // GET MY UPI PROFILE
    // =========================================================

    public UpiProfile getMyProfile() {

        String username = getCurrentUsername();

        return upiProfileRepository
                .findByOwnerUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "UPI profile not found for current user"
                        )
                );
    }

    // =========================================================
    // GET BY UPI ID
    // Used for receiver verification
    // =========================================================

    public UpiProfile getByUpiId(String upiId) {

        if (upiId == null ||
                upiId.isBlank()) {

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
                                "UPI ID not found: " +
                                        normalizedUpiId
                        )
                );
    }

    // =========================================================
    // VERIFY UPI ID BELONGS TO CURRENT USER
    // =========================================================

    public UpiProfile getMyProfileByUpiId(
            String upiId) {

        if (upiId == null ||
                upiId.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "UPI ID is required"
            );
        }

        String username = getCurrentUsername();

        String normalizedUpiId = upiId
                .trim()
                .toLowerCase(Locale.ROOT);

        return upiProfileRepository
                .findByUpiIdAndOwnerUsername(
                        normalizedUpiId,
                        username
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "This UPI ID does not belong to the authenticated user"
                        )
                );
    }

    // =========================================================
    // GET BY ACCOUNT ID
    // =========================================================

    public UpiProfile getByAccountId(
            Long accountId) {

        if (accountId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Account ID is required"
            );
        }

        return upiProfileRepository
                .findByAccount_Id(accountId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "UPI profile not found"
                        )
                );
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    public UpiProfile updateStatus(
            Long id,
            boolean active) {

        if (id == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Profile ID is required"
            );
        }

        UpiProfile profile =
                upiProfileRepository
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
