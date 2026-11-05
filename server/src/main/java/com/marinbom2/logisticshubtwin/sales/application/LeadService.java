package com.marinbom2.logisticshubtwin.sales.application;

import com.marinbom2.logisticshubtwin.sales.api.dto.LeadCreateRequest;
import com.marinbom2.logisticshubtwin.sales.domain.Lead;
import com.marinbom2.logisticshubtwin.sales.domain.LeadRepository;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 도입 문의 접수 (FR-SL-002). 로그에는 접수 번호와 허브 수만 남긴다 (이름·이메일 제외) */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final Clock clock;

    @Transactional
    public Lead receive(LeadCreateRequest request) {
        Lead lead = leadRepository.save(Lead.receive(request.companyName(), request.contactName(), request.email(),
                request.hubCount(), request.message(), clock.instant()));
        log.info("[sales] lead received leadId={} hubCount={}", lead.getId(), lead.getHubCount());
        return lead;
    }
}
