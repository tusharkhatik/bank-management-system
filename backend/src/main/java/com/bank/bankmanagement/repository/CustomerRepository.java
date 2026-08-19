package com.bank.bankmanagement.repository;

import com.bank.bankmanagement.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByEmail(String email);

    @Query("""
            SELECT c
            FROM Customer c
            JOIN FETCH c.user u
            WHERE u.username = :username
            """)
    Optional<Customer> findByUsername(String username);

    @Query("""
            SELECT c
            FROM Customer c
            JOIN FETCH c.user
            """)
    List<Customer> findAllWithUser();

    @Query("""
            SELECT c
            FROM Customer c
            JOIN FETCH c.user
            WHERE c.id = :id
            """)
    Optional<Customer> findByIdWithUser(Long id);
}
