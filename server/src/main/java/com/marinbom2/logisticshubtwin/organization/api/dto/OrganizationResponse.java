package com.marinbom2.logisticshubtwin.organization.api.dto;

import com.marinbom2.logisticshubtwin.organization.domain.Organization;
import com.marinbom2.logisticshubtwin.organization.domain.PlanType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(description = "고객사 워크스페이스")
public record OrganizationResponse(
        @Schema(description = "고객사 ID", example = "1") Long organizationId,
        @Schema(description = "회사명", example = "한빛물류") String name,
        @Schema(description = "요금제. {code, description}") PlanType planType,
        @Schema(description = "파일럿 종료 시각 (UTC)") Instant pilotEndsAt
) {

    public static OrganizationResponse from(Organization organization) {
        return new OrganizationResponse(organization.getId(), organization.getName(), organization.getPlanType(),
                organization.getPilotEndsAt());
    }
}
