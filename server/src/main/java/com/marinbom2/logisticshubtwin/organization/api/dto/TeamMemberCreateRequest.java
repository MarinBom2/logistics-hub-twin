package com.marinbom2.logisticshubtwin.organization.api.dto;

import com.marinbom2.logisticshubtwin.member.domain.RoleType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 팀원 계정 발급 (FR-OR-002). 초기 비밀번호는 관리자가 정해 따로 전달한다 */
@Schema(description = "팀원 계정 발급 요청")
public record TeamMemberCreateRequest(
        @Schema(description = "이메일(로그인 ID)", example = "operator@example.com")
        @NotBlank @Email @Size(max = 100) String email,

        @Schema(description = "초기 비밀번호. 8~20자, 영문·숫자 포함", example = "Passw0rd!")
        @NotBlank String password,

        @Schema(description = "권한 이름", example = "OPERATOR")
        @NotNull RoleType roleType
) {
}
