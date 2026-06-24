package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class JobAnalysisRequest {
    @NotBlank
    private String jobDescription;

    @NotNull
    private List<String> skills;

    public JobAnalysisRequest() {}

    public JobAnalysisRequest(String jobDescription, List<String> skills) {
        this.jobDescription = jobDescription;
        this.skills = skills;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }
}
