package com.marinbom2.logisticshubtwin.sales.domain;

import com.marinbom2.logisticshubtwin.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 도입 문의 (랜딩 페이지 SCR-00). 담당자 이름·이메일은 개인정보라 응답·로그에 그대로 남기지 않는다.
 * 문의 응대가 끝나면 파기하는 배치는 batch 모듈에 둔다 (md/business-plan.md §9).
 */
@Getter
@Entity
@Table(name = "sales_lead")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lead extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;

    @Column(name = "contact_name", nullable = false, length = 50)
    private String contactName;

    @Column(nullable = false, length = 100)
    private String email;

    /** 운영 중인 허브 수. 견적과 파일럿 범위를 정하는 데 쓴다 */
    @Column(name = "hub_count", nullable = false)
    private int hubCount;

    @Column(length = 1000)
    private String message;

    @Column(name = "privacy_agreed_at", nullable = false)
    private Instant privacyAgreedAt;

    public static Lead receive(String companyName, String contactName, String email, int hubCount, String message,
                               Instant agreedAt) {
        Lead lead = new Lead();
        lead.companyName = companyName.trim();
        lead.contactName = contactName.trim();
        lead.email = email.trim().toLowerCase(Locale.ROOT);
        lead.hubCount = hubCount;
        lead.message = message == null || message.isBlank() ? null : message.trim();
        lead.privacyAgreedAt = agreedAt;
        return lead;
    }
}
