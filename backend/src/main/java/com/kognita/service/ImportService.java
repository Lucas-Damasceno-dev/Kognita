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
            
            // Tenta obter o nó usando a estrutura padrão data -> roadmap -> topics
            JsonNode roadmapNode = root.path("data").path("roadmap").path("topics");
            
            // Fallbacks se não encontrar na estrutura padrão
            if (roadmapNode.isMissingNode() || !roadmapNode.isArray()) {
                if (root.isArray()) {
                    roadmapNode = root;
                } else if (root.has("topics") && root.path("topics").isArray()) {
                    roadmapNode = root.path("topics");
                } else if (root.has("children") && root.path("children").isArray()) {
                    roadmapNode = root.path("children");
                }
            }

            if (!roadmapNode.isArray() || roadmapNode.isEmpty()) {
                throw new IllegalArgumentException("Nenhum tópico ou tarefa válida encontrada no JSON do roadmap.");
            }

            var subject = subjectService.create(new CreateSubjectRequest(title, null, null), userId);
            int count = 0;

            for (JsonNode topicNode : roadmapNode) {
                String topicName = null;
                if (topicNode.has("name")) {
                    topicName = topicNode.path("name").asText();
                } else if (topicNode.has("title")) {
                    topicName = topicNode.path("title").asText();
                }

                if (topicName != null && !topicName.trim().isEmpty()) {
                    taskService.create(new CreateTaskRequest(topicName, null, "pending", "medium", subject.id(), null, title, false), userId);
                    count++;
                }
            }

            if (count == 0) {
                throw new IllegalArgumentException("Nenhum tópico com nome ou título válido encontrado no JSON do roadmap.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse roadmap JSON: " + e.getMessage(), e);
        }
    }
}
