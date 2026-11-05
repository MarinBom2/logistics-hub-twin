package com.marinbom2.logisticshubtwin.organization.domain;

import com.marinbom2.logisticshubtwin.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Duration;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 고객사(테넌트). 센터·회원·이력은 모두 고객사 하나에 속하고, 다른 고객사의 데이터는 보이지 않는다
 * (md/authentication-security.md §9 멀티테넌시).
 */
@Getter
@Entity
@Table(name = "organization")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Organization extends BaseEntity {

    /** 파일럿 기간: 연결 2주 + 기준선 측정 4주 + 개선 측정 2주 (md/business-plan.md §5) */
    public static final Duration PILOT_PERIOD = Duration.ofDays(56);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 회사명 */
    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false, length = 20)
    private PlanType planType;

    /** 파일럿이 끝나는 시각. 유료 요금제로 바꾸면 의미가 없어진다 */
    @Column(name = "pilot_ends_at")
    private Instant pilotEndsAt;

    /** 워크스페이스 만들기. 파일럿으로 시작한다 */
    public static Organization startPilot(String name, Instant now) {
        Organization organization = new Organization();
        organization.name = name.trim();
        organization.planType = PlanType.PILOT;
        organization.pilotEndsAt = now.plus(PILOT_PERIOD);
        return organization;
    }
}
