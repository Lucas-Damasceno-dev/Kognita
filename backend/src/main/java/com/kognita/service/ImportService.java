package com.kognita.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.CreateTaskRequest;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ImportService {

    private final SubjectService subjectService;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    public ImportService(SubjectService subjectService, TaskService taskService, ObjectMapper objectMapper) {
        this.subjectService = subjectService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }

    public void importRoadmap(String title, String jsonContent, UUID userId) {
        try {
            JsonNode root = objectMapper.readTree(jsonContent);
            // Assuming structure data -> roadmap -> topics
            JsonNode roadmapNode = root.path("data").path("roadmap").path("topics");
            
            var subject = subjectService.create(new CreateSubjectRequest(title, null, null), userId);

            for (JsonNode topicNode : roadmapNode) {
                // The structure might vary, but assuming there's a 'name' field
                String topicName = topicNode.path("name").asText("Unknown Topic");
                taskService.create(new CreateTaskRequest(topicName, null, "pending", "medium", subject.id(), null, title, false), userId);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse roadmap JSON", e);
        }
    }
}
