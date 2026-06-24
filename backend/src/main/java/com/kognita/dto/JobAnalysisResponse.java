package com.kognita.dto;

import java.util.List;

public class JobAnalysisResponse {
    private List<String> skillsFound;
    private List<String> skillsMissing;
    private String readinessLevel;

    public JobAnalysisResponse(List<String> skillsFound, List<String> skillsMissing, String readinessLevel) {
        this.skillsFound = skillsFound;
        this.skillsMissing = skillsMissing;
        this.readinessLevel = readinessLevel;
    }

    public List<String> getSkillsFound() {
        return skillsFound;
    }

    public void setSkillsFound(List<String> skillsFound) {
        this.skillsFound = skillsFound;
    }

    public List<String> getSkillsMissing() {
        return skillsMissing;
    }

    public void setSkillsMissing(List<String> skillsMissing) {
        this.skillsMissing = skillsMissing;
    }

    public String getReadinessLevel() {
        return readinessLevel;
    }

    public void setReadinessLevel(String readinessLevel) {
        this.readinessLevel = readinessLevel;
    }
}
