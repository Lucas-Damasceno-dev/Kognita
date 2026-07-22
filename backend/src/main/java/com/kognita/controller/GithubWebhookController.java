package com.kognita.controller;

import com.kognita.model.ChallengeAttempt;
import com.kognita.model.Task;
import com.kognita.model.User;
import com.kognita.repository.ChallengeAttemptRepository;
import com.kognita.repository.TaskRepository;
import com.kognita.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/github")
public class GithubWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(GithubWebhookController.class);

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ChallengeAttemptRepository challengeAttemptRepository;
    private final com.kognita.service.SubjectService subjectService;
    private final com.kognita.service.UserService userService;
    private final ObjectMapper objectMapper;
    private final String webhookSecret;

    public GithubWebhookController(UserRepository userRepository,
                                   TaskRepository taskRepository,
                                   ChallengeAttemptRepository challengeAttemptRepository,
                                   com.kognita.service.SubjectService subjectService,
                                   com.kognita.service.UserService userService,
                                   ObjectMapper objectMapper,
                                   @Value("${github.webhook.secret:}") String webhookSecret) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.challengeAttemptRepository = challengeAttemptRepository;
        this.subjectService = subjectService;
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.webhookSecret = webhookSecret;
    }

    private boolean verifySignature(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            logger.warn("GitHub webhook secret is not configured. Webhook payload verification is disabled!");
            return true;
        }
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }
        String expectedSignature = signatureHeader.substring(7);
        try {
            javax.crypto.spec.SecretKeySpec signingKey = new javax.crypto.spec.SecretKeySpec(
                webhookSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return java.security.MessageDigest.isEqual(
                hexString.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                expectedSignature.getBytes(java.nio.charset.StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            logger.error("Error verifying GitHub webhook signature", e);
            return false;
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<String> handlePushWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String payloadString) {
        
        if (!verifySignature(payloadString, signature)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(payloadString, objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid JSON payload");
        }

        var repository = (Map<String, Object>) payload.get("repository");
        if (repository == null) {
            return ResponseEntity.badRequest().body("Missing repository details");
        }
        String repoFullName = (String) repository.get("full_name");
        if (repoFullName == null) {
            return ResponseEntity.badRequest().body("Missing repository full name");
        }

        var userOpt = userRepository.findByGithubRepo(repoFullName);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok("Repository not linked to any user");
        }
        var user = userOpt.get();

        var commits = (List<Map<String, Object>>) payload.get("commits");
        if (commits == null || commits.isEmpty()) {
            return ResponseEntity.ok("No commits found");
        }

        int processedTasks = 0;

        for (var commit : commits) {
            String message = (String) commit.get("message");
            String hash = (String) commit.get("id");
            if (message == null) continue;

            // Find all pending/in_progress tasks for the user
            var pendingTasks = taskRepository.findByUserId(user.getId())
                .stream()
                .filter(t -> !"completed".equals(t.getStatus()))
                .toList();

            for (var task : pendingTasks) {
                boolean matched = false;

                // Match 1: Full UUID
                if (message.contains(task.getId().toString())) {
                    matched = true;
                }

                // Match 2: Short UUID (first 8 chars prefixed with #)
                String shortId = "#" + task.getId().toString().substring(0, 8);
                if (message.contains(shortId)) {
                    matched = true;
                }

                // Match 3: Task title (case-insensitive)
                if (message.toLowerCase().contains(task.getTitle().toLowerCase())) {
                    matched = true;
                }

                if (matched) {
                    // Update task
                    task.setStatus("completed");
                    task.setVerifiedByGit(true);
                    taskRepository.save(task);

                    // Update user experience
                    int xp = task.getExperiencePoints();
                    if (task.getSubject() != null && subjectService.isWeeklySubject(task.getSubject().getId(), user.getId())) {
                        xp = (int) (xp * 1.5);
                    }
                    userService.awardXp(user.getId(), xp, "TASK", "Tarefa verificada e concluída via GitHub: " + task.getTitle());

                    // Log Challenge Attempt
                    var attempt = new ChallengeAttempt();
                    attempt.setTask(task);
                    attempt.setUser(user);
                    attempt.setUsedAi(false);
                    attempt.setVerifiedByGit(true);
                    attempt.setGitCommitHash(hash);
                    attempt.setSkillCategory(task.getSkillCategory());
                    attempt.setNotes("Verificado automaticamente via GitHub commit: " + message);
                    attempt.setDate(LocalDate.now());
                    challengeAttemptRepository.save(attempt);

                    processedTasks++;
                }
            }
        }

        return ResponseEntity.ok("Processed " + processedTasks + " tasks");
    }
}
