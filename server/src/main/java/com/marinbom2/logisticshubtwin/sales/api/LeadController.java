package com.marinbom2.logisticshubtwin.sales.api;

import com.marinbom2.logisticshubtwin.sales.api.dto.LeadCreateRequest;
import com.marinbom2.logisticshubtwin.sales.api.dto.LeadCreateResponse;
import com.marinbom2.logisticshubtwin.sales.application.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "도입 문의", description = "랜딩 페이지 문의 접수 (SCR-00)")
@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @Operation(summary = "도입 문의 접수", description = "FR-SL-002. 로그인 없이 부른다. 개인정보 수집·이용 동의가 있어야 받는다")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeadCreateResponse create(@Valid @RequestBody LeadCreateRequest request) {
        return new LeadCreateResponse(leadService.receive(request).getId());
    }
}
