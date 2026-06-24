package com.kognita.dto;

public class JobAnalysisRequest {
    private String jobDescription;

    public JobAnalysisRequest() {}

    public JobAnalysisRequest(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }
}
