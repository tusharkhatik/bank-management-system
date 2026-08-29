package com.bank.bankmanagement.config;

import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;
import com.bank.bankmanagement.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

                System.out.println("========== JWT FILTER ==========");
System.out.println("REQUEST: " + request.getMethod() + " " + request.getRequestURI());
System.out.println("AUTH HEADER EXISTS: " + (authorizationHeader != null));
System.out.println("================================");

        /*
         * No JWT → continue.
         * Spring Security will decide whether the endpoint
         * requires authentication.
         */
        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authorizationHeader.substring(7).trim();

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            /*
             * Validate token first.
             */
            if (!jwtService.isTokenValid(token)) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Extract username from JWT.
             */
            String username =
                    jwtService.extractUsername(token);

            if (username == null || username.isBlank()) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * Do not blindly trust the role from JWT.
             *
             * Load the current user from database.
             */
            User user = userRepository
                    .findByUsername(username)
                    .orElse(null);

            if (user == null) {

                SecurityContextHolder.clearContext();

                filterChain.doFilter(request, response);
                return;
            }

            /*
             * If authentication is not already present,
             * create Spring Security authentication.
             */
            if (SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null) {

                String role = user.getRole();

                if (role == null || role.isBlank()) {

                    SecurityContextHolder.clearContext();

                    filterChain.doFilter(request, response);
                    return;
                }

                String normalizedRole =
                        role.startsWith("ROLE_")
                                ? role.substring(5)
                                : role;

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(
                                "ROLE_" + normalizedRole
                        );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user.getUsername(),
                                null,
                                List.of(authority)
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

                System.out.println(
                        "JWT AUTHENTICATED USER: "
                                + user.getUsername()
                );

                System.out.println(
                        "AUTHORITY: ROLE_"
                                + normalizedRole
                );
            }

        } catch (Exception e) {

            SecurityContextHolder.clearContext();

            System.err.println(
                    "JWT authentication failed: "
                            + e.getMessage()
            );
        }

        filterChain.doFilter(request, response);
    }
}