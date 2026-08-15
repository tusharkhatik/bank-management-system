package com.bank.bankmanagement.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // ==============================
    // PASSWORD ENCODER
    // ==============================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ==============================
    // SECURITY CONFIGURATION
    // ==============================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http

                // Disable CSRF because we are using JWT
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless JWT authentication
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Allow CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Authentication APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // Admin APIs
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                // JWT filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ==============================
    // CORS CONFIGURATION
    // ==============================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        /*
         * Frontend:
         * https://silver-waffle-4j65r775v6ggf95-5173.app.github.dev
         *
         * Backend:
         * https://silver-waffle-4j65r775v6ggf95-8080.app.github.dev
         *
         * Both are different origins, therefore CORS is required.
         */

        configuration.setAllowedOriginPatterns(
                List.of(
                        "https://*.app.github.dev",
                        "http://localhost:5173",
                        "http://localhost:3000"
                )
        );

        // HTTP methods allowed from frontend
        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        // Headers allowed from frontend
        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With"
                )
        );

        // Allow Authorization credentials / JWT
        configuration.setAllowCredentials(true);

        // Optional: expose useful response headers
        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}