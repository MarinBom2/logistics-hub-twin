package com.marinbom2.logisticshubtwin.center.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** 모든 조회는 고객사 ID 를 함께 받는다. 다른 고객사의 센터는 없는 것과 같다 */
public interface CenterRepository extends JpaRepository<Center, Long> {

    List<Center> findAllByOrganizationIdOrderByCodeAsc(Long organizationId);

    boolean existsByOrganizationIdAndCode(Long organizationId, String code);
}
