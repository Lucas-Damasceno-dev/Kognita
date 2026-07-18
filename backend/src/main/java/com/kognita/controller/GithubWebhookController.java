package com.kognita.controller;

import com.kognita.model.ChallengeAttempt;
import com.kognita.model.Task;
import com.kognita.model.User;
import com.kognita.repository.ChallengeAttemptRepository;
import com.kognita.repository.TaskRepository;
import com.kognita.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/github")
public class GithubWebhookController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ChallengeAttemptRepository challengeAttemptRepository;
    private final com.kognita.service.SubjectService subjectService;

    public GithubWebhookController(UserRepository userRepository,
                                   TaskRepository taskRepository,
                                   ChallengeAttemptRepository challengeAttemptRepository,
                                   com.kognita.service.SubjectService subjectService) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.challengeAttemptRepository = challengeAttemptRepository;
        this.subjectService = subjectService;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<String> handlePushWebhook(@RequestBody Map<String, Object> payload) {
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
                    user.setTotalExperience(user.getTotalExperience() + xp);
                    userRepository.save(user);

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
