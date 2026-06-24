package com.kognita.service;

import com.kognita.dto.JobAnalysisRequest;
import com.kognita.dto.JobAnalysisResponse;
import com.kognita.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final TaskRepository taskRepository;

    public JobService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public JobAnalysisResponse analyze(JobAnalysisRequest request, UUID userId) {
        List<String> userSkills = taskRepository.findDistinctSkillCategoriesByUserId(userId);
        String jobDescription = request.getJobDescription().toLowerCase();

        List<String> skillsFound = new ArrayList<>();
        List<String> skillsMissing = new ArrayList<>();

        for (String skill : userSkills) {
            if (jobDescription.contains(skill.toLowerCase())) {
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
