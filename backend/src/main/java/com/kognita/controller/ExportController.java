package com.kognita.controller;

import com.kognita.dto.ExportDataDTO;
import com.kognita.model.User;
import com.kognita.service.ExportService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping
    public ResponseEntity<ExportDataDTO> exportData(@AuthenticationPrincipal User user) {
        ExportDataDTO data = exportService.exportData(user.getId());
        return ResponseEntity.ok(data);
    }
}
