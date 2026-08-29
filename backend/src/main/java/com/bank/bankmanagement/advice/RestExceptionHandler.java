package com.bank.bankmanagement.advice;
import org.springframework.web.server.ResponseStatusException;

import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.ErrorResponse;
import com.bank.bankmanagement.exception.InsufficientFundsException;
import com.bank.bankmanagement.exception.NotFoundException;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(
            NotFoundException ex,
            WebRequest req) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                req
        );
    }

    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<?> handleInsufficient(
            InsufficientFundsException ex,
            WebRequest req) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                req
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(
            BadRequestException ex,
            WebRequest req) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                req
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(
            MethodArgumentNotValidException ex,
            WebRequest req) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse(ex.getMessage());

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                message,
                req
        );
    }


    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(
            ConstraintViolationException ex,
            WebRequest req) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                req
        );
    }
@ExceptionHandler(ResponseStatusException.class)
public ResponseEntity<?> handleResponseStatusException(
        ResponseStatusException ex,
        WebRequest req) {

    return buildResponse(
            HttpStatus.valueOf(ex.getStatusCode().value()),
            ex.getReason(),
            req
    );
}
    /*
     * =========================================================
     * GLOBAL EXCEPTION HANDLER
     * =========================================================
     *
     * Temporarily exposes the actual exception so we can find
     * the real cause of the /api/accounts HTTP 500 error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(
            Exception ex,
            WebRequest req) {

        ex.printStackTrace();

        String message =
                ex.getClass().getName()
                        + ": "
                        + ex.getMessage();

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                message,
                req
        );
    }

    private ResponseEntity<?> buildResponse(
            HttpStatus status,
            String message,
            WebRequest req) {

        String path = req.getDescription(false)
                .replace("uri=", "");

        ErrorResponse response = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}