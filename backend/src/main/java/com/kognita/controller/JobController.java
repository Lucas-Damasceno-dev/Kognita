package com.kognita.controller;

import com.kognita.dto.JobAnalysisRequest;
import com.kognita.dto.JobAnalysisResponse;
import com.kognita.model.User;
import com.kognita.service.JobService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService service;

    public JobController(JobService service) {
        this.service = service;
    }

    @PostMapping("/analyze")
    public JobAnalysisResponse analyze(@RequestBody JobAnalysisRequest request, @AuthenticationPrincipal User user) {
        return service.analyze(request, user.getId());
    }
}
