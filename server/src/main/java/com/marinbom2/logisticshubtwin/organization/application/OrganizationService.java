package com.marinbom2.logisticshubtwin.organization.application;

import com.marinbom2.logisticshubtwin.exception.BusinessException;
import com.marinbom2.logisticshubtwin.organization.domain.Organization;
import com.marinbom2.logisticshubtwin.organization.domain.OrganizationRepository;
import com.marinbom2.logisticshubtwin.type.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 고객사 워크스페이스 조회 (FR-OR-001) */
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public Organization get(Long organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_DATA));
    }
}
