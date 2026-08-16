package com.bank.bankmanagement.upi.service;

import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.service.AccountService;
import com.bank.bankmanagement.upi.dto.UpiPaymentRequest;
import com.bank.bankmanagement.upi.dto.UpiPaymentResponse;
import com.bank.bankmanagement.upi.model.UpiProfile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class UpiPaymentService {

    private final UpiProfileService upiProfileService;
    private final AccountService accountService;

    public UpiPaymentService(
            UpiProfileService upiProfileService,
            AccountService accountService
    ) {
        this.upiProfileService = upiProfileService;
        this.accountService = accountService;
    }

    @Transactional
    public UpiPaymentResponse makePayment(UpiPaymentRequest request) {

        if (request == null) {
            throw new IllegalArgumentException("Payment request is required");
        }

        if (request.getAmount() == null ||
                request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero"
            );
        }

        UpiProfile sender =
                upiProfileService.getByUpiId(request.getSenderUpiId());

        UpiProfile receiver =
                upiProfileService.getByUpiId(request.getReceiverUpiId());

        if (!sender.isActive()) {
            throw new IllegalArgumentException(
                    "Sender UPI profile is inactive"
            );
        }

        if (!receiver.isActive()) {
            throw new IllegalArgumentException(
                    "Receiver UPI profile is inactive"
            );
        }

        if (sender.getAccountId().equals(receiver.getAccountId())) {
            throw new IllegalArgumentException(
                    "Sender and receiver cannot be the same account"
            );
        }

        TransferRequest transferRequest = new TransferRequest();

        transferRequest.setFromAccountId(sender.getAccountId());
        transferRequest.setToAccountId(receiver.getAccountId());
        transferRequest.setAmount(request.getAmount());

        accountService.transfer(transferRequest);

        return new UpiPaymentResponse(
                "SUCCESS",
                "UPI payment completed successfully",
                sender.getUpiId(),
                receiver.getUpiId(),
                request.getAmount()
        );
    }
}
