package com.kognita.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kognita.dto.JobAnalysisRequest;
import com.kognita.dto.JobAnalysisResponse;
import com.kognita.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class JobService {

    private final TaskRepository taskRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public JobService(TaskRepository taskRepository, AiService aiService, ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public JobAnalysisResponse analyze(JobAnalysisRequest request, UUID userId) {
        List<String> userSkills = taskRepository.findDistinctSkillCategoriesByUserId(userId);
        String jobDescription = request.getJobDescription();

        try {
            String prompt = """
                Analyze the following job description against the user's technical skills.
                User Skills: %s
                Job Description: %s
                
                Identify:
                1. Which of the user's skills are found/required in the job description (skillsFound).
                2. Which other essential technical skills required by the job are missing from the user's skills list (skillsMissing).
                3. The overall readiness level ("High", "Medium", or "Low") based on the percentage of required skills the user possesses.
                
                Return ONLY a JSON object (without markdown blocks or ```json tags, just raw JSON) with the following structure:
                {
                  "skillsFound": ["skill1", "skill2"],
                  "skillsMissing": ["skill3", "skill4"],
                  "readinessLevel": "High"
                }
                """.formatted(userSkills.toString(), jobDescription);

            String aiResponse = aiService.generateContent(prompt);
            if (aiResponse != null) {
                String cleanJson = aiResponse.trim();
                if (cleanJson.startsWith("```json")) {
                    cleanJson = cleanJson.substring(7);
                }
                if (cleanJson.startsWith("```")) {
                    cleanJson = cleanJson.substring(3);
                }
                if (cleanJson.endsWith("```")) {
                    cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
                }
                cleanJson = cleanJson.trim();
                
                return objectMapper.readValue(cleanJson, JobAnalysisResponse.class);
            }
        } catch (Exception e) {
            // Fallback to simple local analysis if AI fails
        }

        // Fallback logic
        String jobDescriptionLower = jobDescription.toLowerCase();
        List<String> skillsFound = new ArrayList<>();
        List<String> skillsMissing = new ArrayList<>();

        for (String skill : userSkills) {
            if (jobDescriptionLower.contains(skill.toLowerCase())) {
                skillsFound.add(skill);
            } else {
                skillsMissing.add(skill);
            }
        }

        double readiness = userSkills.isEmpty() ? 0 : (double) skillsFound.size() / userSkills.size();
        String readinessLevel = readiness > 0.7 ? "High" : (readiness > 0.4 ? "Medium" : "Low");

        return new JobAnalysisResponse(skillsFound, skillsMissing, readinessLevel);
    }
}
