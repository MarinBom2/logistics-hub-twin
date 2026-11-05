package com.marinbom2.logisticshubtwin.center.domain;

import com.marinbom2.logisticshubtwin.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 고객사가 관제하는 허브 센터 (마스터). 실시간 상태는 Redis(M3), 이력은 MySQL(M3)에 따로 둔다.
 * 센터 코드는 고객사 안에서만 유일하다. 수집기(edge-collector)가 이 코드로 메시지를 보낸다.
 */
@Getter
@Entity
@Table(name = "center", uniqueConstraints =
        @UniqueConstraint(name = "uk_center_org_code", columnNames = {"organization_id", "code"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Center extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    /** 예: HUB-Y3. 대문자로 맞춘다 */
    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    /** 지역 묶음 (네트워크 화면의 지역 필터) */
    @Column(nullable = false, length = 50)
    private String region;

    public static Center register(Long organizationId, String code, String name, String region) {
        Center center = new Center();
        center.organizationId = organizationId;
        center.code = normalizeCode(code);
        center.name = name.trim();
        center.region = region.trim();
        return center;
    }

    public static String normalizeCode(String rawCode) {
        return rawCode == null ? "" : rawCode.trim().toUpperCase(Locale.ROOT);
    }
}
