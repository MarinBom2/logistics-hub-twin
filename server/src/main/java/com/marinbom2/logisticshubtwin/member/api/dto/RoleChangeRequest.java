package com.marinbom2.logisticshubtwin.member.api.dto;

import com.marinbom2.logisticshubtwin.member.domain.RoleType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/** 내 권한 바꾸기 (local 전용, FR-AU-003) */
@Schema(description = "권한 변경 요청")
public record RoleChangeRequest(
        @Schema(description = "바꿀 권한 이름", example = "OPERATOR") @NotNull RoleType roleType
) {
}
