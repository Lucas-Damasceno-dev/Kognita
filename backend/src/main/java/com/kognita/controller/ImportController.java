package com.kognita.controller;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.CreateTaskRequest;
import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.CreateTaskRequest;
import com.kognita.model.User;
import com.kognita.service.ImportService;
import com.kognita.service.SubjectService;
import com.kognita.service.TaskService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final SubjectService subjectService;
    private final TaskService taskService;
    private final ImportService importService;

    public ImportController(SubjectService subjectService, TaskService taskService, ImportService importService) {
        this.subjectService = subjectService;
        this.taskService = taskService;
        this.importService = importService;
    }

    public record CategoryTasks(String category, List<String> tasks) {}

    @PostMapping("/file-structure")
    public void importFileStructure(
            @RequestBody List<CategoryTasks> data,
            @RequestParam(required = false) UUID userId,
            @AuthenticationPrincipal User user) {
        UUID finalUserId = user != null ? user.getId() : userId;
        if (finalUserId == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        for (CategoryTasks item : data) {
            var subjects = subjectService.findAllByUser(finalUserId);
            var subject = subjects.stream()
                    .filter(s -> s.name().equalsIgnoreCase(item.category()))
                    .findFirst()
                    .orElseGet(() -> subjectService.create(new CreateSubjectRequest(item.category(), null, null), finalUserId));

            for (String taskTitle : item.tasks()) {
                taskService.create(new CreateTaskRequest(taskTitle, null, "pending", "medium", subject.id(), null, item.category(), false), finalUserId);
            }
        }
    }

    public record RoadmapRequest(String title, String content) {}

    @PostMapping("/roadmap")
    public void importRoadmap(
            @RequestBody RoadmapRequest request,
            @RequestParam(required = false) UUID userId,
            @AuthenticationPrincipal User user) {
        UUID finalUserId = user != null ? user.getId() : userId;
        if (finalUserId == null) {
            throw new IllegalArgumentException("User ID is required");
        }
        importService.importRoadmap(request.title(), request.content(), finalUserId);
    }
}
