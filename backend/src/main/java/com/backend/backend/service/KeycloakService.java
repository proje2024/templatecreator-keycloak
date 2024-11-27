package com.backend.backend.service;

import org.springframework.beans.factory.annotation.Value;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class KeycloakService {
    @Value("${BASE_URL}:${FRONTEND_HOST}/home")
    private static String frontendHomeURL;

    @Value("http://keycloak:${KEYCLOAK_PORT}/realms/template/protocol/openid-connect/token")
    private static String keycloakPort;

    @Value("${KEYCLOAK_CLIENT}")
    private static String keycloakClient;

    @Value("${KEYCLOAK_CREDENTIALS_SECRET}")
    private static String keycloakCredentialsSecret;

    private static final Logger logger = LoggerFactory.getLogger(KeycloakService.class);
    private static final String TOKEN_ENDPOINT = keycloakPort;
    private static final String CLIENT_ID = keycloakClient;
    private static final String CLIENT_SECRET = keycloakCredentialsSecret;
    private static final String REDIRECT_URI = frontendHomeURL;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, Object> decodeJwt(String token) {
        try {
            String[] parts = token.split("\\."); // Split JWT into parts
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            return objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode JWT token: " + e.getMessage(), e);
        }
    }

    private String[] extractRoles(Map<String, Object> tokenClaims) {
        List<String> roles = new ArrayList<>();

        // Extract roles from realm_access
        if (tokenClaims.containsKey("realm_access")) {
            Map<String, Object> realmAccess = (Map<String, Object>) tokenClaims.get("realm_access");
            if (realmAccess.containsKey("roles")) {
                roles.addAll((List<String>) realmAccess.get("roles"));
            }
        }


        return roles.toArray(new String[0]);
    }

    public Map<String, Object> getToken(String code) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        String form = "client_id=" + URLEncoder.encode(CLIENT_ID, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(CLIENT_SECRET, StandardCharsets.UTF_8) +
                "&grant_type=" + URLEncoder.encode("authorization_code", StandardCharsets.UTF_8) +
                "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TOKEN_ENDPOINT))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response;
        try {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseBody = objectMapper.readValue(response.body(),
                        new TypeReference<Map<String, Object>>() {
                        });
                String token = (String) responseBody.get("access_token");
                if (token != null) {
                    Map<String, Object> tokenClaims = decodeJwt(token);
                    responseBody.put("roles", extractRoles(tokenClaims));
                }
                return responseBody;
            } else {
                throw new RuntimeException("Keycloak'tan token alınamadı: " + response.body());
            }
        } catch (java.net.http.HttpTimeoutException e) {
            throw new RuntimeException("Zaman aşımı hatası: " + e.getMessage(), e);
        } catch (java.io.IOException e) {
            throw new RuntimeException("IO hatası: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            throw new RuntimeException("İstek kesildi: " + e.getMessage(), e);
        }

    }

    public Map<String, Object> refreshToken(String refreshToken) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        String form = "client_id=" + URLEncoder.encode(CLIENT_ID, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(CLIENT_SECRET, StandardCharsets.UTF_8) +
                "&grant_type=" + URLEncoder.encode("refresh_token", StandardCharsets.UTF_8) +
                "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TOKEN_ENDPOINT))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response;
        try {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> responseBody = objectMapper.readValue(response.body(),
                        new TypeReference<Map<String, Object>>() {
                        });
                return responseBody;
            } else {
                logger.error("Failed to refresh token from Keycloak: {}", response.body());
                throw new RuntimeException("Failed to refresh token from Keycloak: " + response.body());
            }
        } catch (Exception e) {
            logger.error("Exception occurred while trying to refresh token: {}", e.getMessage());
            throw new RuntimeException("Exception occurred while trying to refresh token", e);
        }
    }
}
