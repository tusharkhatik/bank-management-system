package com.bank.bankmanagement.upi.service;

import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.service.AccountService;
import com.bank.bankmanagement.upi.dto.UpiPaymentRequest;
import com.bank.bankmanagement.upi.dto.UpiPaymentResponse;
import com.bank.bankmanagement.upi.model.UpiProfile;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Locale;

@Service
public class UpiPaymentService {

    private final UpiProfileService upiProfileService;
    private final AccountService accountService;

    public UpiPaymentService(
            UpiProfileService upiProfileService,
            AccountService accountService) {

        this.upiProfileService = upiProfileService;
        this.accountService = accountService;
    }

    // =========================================================
    // MAKE UPI PAYMENT
    // =========================================================

    @Transactional
    public UpiPaymentResponse makePayment(
            UpiPaymentRequest request) {

        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment request is required"
            );
        }

        if (request.getSenderUpiId() == null ||
                request.getSenderUpiId().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sender UPI ID is required"
            );
        }

        if (request.getReceiverUpiId() == null ||
                request.getReceiverUpiId().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Receiver UPI ID is required"
            );
        }

        if (request.getAmount() == null ||
                request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment amount must be greater than zero"
            );
        }

        // -----------------------------------------------------
        // Normalize UPI IDs
        // -----------------------------------------------------

        String senderUpiId = request.getSenderUpiId()
                .trim()
                .toLowerCase(Locale.ROOT);

        String receiverUpiId = request.getReceiverUpiId()
                .trim()
                .toLowerCase(Locale.ROOT);

        // -----------------------------------------------------
        // Sender and receiver cannot be the same UPI ID
        // -----------------------------------------------------

        if (senderUpiId.equals(receiverUpiId)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sender and receiver UPI IDs cannot be the same"
            );
        }

        // -----------------------------------------------------
        // Get receiver
        //
        // Receiver can belong to another user.
        // -----------------------------------------------------

        UpiProfile receiver =
                upiProfileService.getByUpiId(
                        receiverUpiId
                );

        if (!receiver.isActive()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Receiver UPI profile is inactive"
            );
        }

        // -----------------------------------------------------
        // Verify sender ownership
        //
        // USER:
        //   Sender UPI must belong to authenticated user.
        //
        // ADMIN:
        //   Existing admin account-transfer permissions are
        //   preserved.
        // -----------------------------------------------------

        UpiProfile sender;

        if (isAdmin()) {

            sender = upiProfileService.getByUpiId(
                    senderUpiId
            );

        } else {

            sender = upiProfileService.getMyProfileByUpiId(
                    senderUpiId
            );
        }

        // -----------------------------------------------------
        // Sender must be active
        // -----------------------------------------------------

        if (!sender.isActive()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sender UPI profile is inactive"
            );
        }

        // -----------------------------------------------------
        // Sender and receiver cannot belong to same account
        // -----------------------------------------------------

        if (sender.getAccount() == null ||
                receiver.getAccount() == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid UPI account configuration"
            );
        }

        if (sender.getAccount().getId()
                .equals(receiver.getAccount().getId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sender and receiver cannot be the same account"
            );
        }

        // -----------------------------------------------------
        // Create account transfer request
        // -----------------------------------------------------

        TransferRequest transferRequest =
                new TransferRequest();

        transferRequest.setFromAccountId(
                sender.getAccount().getId()
        );

        transferRequest.setToAccountId(
                receiver.getAccount().getId()
        );

        transferRequest.setAmount(
                request.getAmount()
        );

        // -----------------------------------------------------
        // Perform actual transfer
        //
        // AccountService performs the final account ownership,
        // status and balance checks.
        // -----------------------------------------------------

        accountService.transfer(transferRequest);

        // -----------------------------------------------------
        // Return payment response
        // -----------------------------------------------------

        return new UpiPaymentResponse(
                "SUCCESS",
                "UPI payment completed successfully",
                sender.getUpiId(),
                receiver.getUpiId(),
                request.getAmount()
        );
    }

    // =========================================================
    // CHECK ADMIN
    // =========================================================

    private boolean isAdmin() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                authentication.getAuthorities() == null) {

            return false;
        }

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(
                                authority.getAuthority()
                        )
                );
    }
}