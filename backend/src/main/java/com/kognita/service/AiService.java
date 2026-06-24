package com.kognita.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class AiService {

    private final WebClient webClient;
    private final String apiKey;

    public AiService(WebClient.Builder webClientBuilder, 
                     @Value("${ai.api.url}") String apiUrl,
                     @Value("${ai.api.key}") String apiKey) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.apiKey = apiKey;
    }

    public String generateContent(String prompt) {
        Map<String, Object> body = Map.of(
            "model", "gpt-4o",
            "messages", new Object[]{
                Map.of("role", "user", "content", prompt)
            }
        );

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    var choices = (java.util.List<?>) response.get("choices");
                    var firstChoice = (Map<?, ?>) choices.get(0);
                    var message = (Map<?, ?>) firstChoice.get("message");
                    return (String) message.get("content");
                })
                .block();
    }
}
