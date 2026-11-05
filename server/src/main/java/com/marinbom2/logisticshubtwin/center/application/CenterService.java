package com.marinbom2.logisticshubtwin.center.application;

import com.marinbom2.logisticshubtwin.center.domain.Center;
import com.marinbom2.logisticshubtwin.center.domain.CenterRepository;
import com.marinbom2.logisticshubtwin.exception.BusinessException;
import com.marinbom2.logisticshubtwin.type.common.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 센터 마스터 (FR-CT-001). 모든 메서드가 고객사 ID 를 받는다. 호출부가 다른 고객사의 센터를 볼 길이 없다 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CenterService {

    private final CenterRepository centerRepository;

    @Transactional(readOnly = true)
    public List<Center> list(Long organizationId) {
        return centerRepository.findAllByOrganizationIdOrderByCodeAsc(organizationId);
    }

    @Transactional
    public Center register(Long organizationId, String code, String name, String region) {
        String normalized = Center.normalizeCode(code);
        if (centerRepository.existsByOrganizationIdAndCode(organizationId, normalized)) {
            throw new BusinessException(ErrorCode.ALREADY_EXIST, "이미 등록된 센터 코드입니다.");
        }
        try {
            Center center = centerRepository.saveAndFlush(Center.register(organizationId, normalized, name, region));
            log.info("[center] registered organizationId={} centerId={}", organizationId, center.getId());
            return center;
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.ALREADY_EXIST, "이미 등록된 센터 코드입니다.");
        }
    }
}
