package com.marinbom2.logisticshubtwin.member.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 가입 = 워크스페이스 만들기 (FR-AU-001). 비밀번호 규칙은 서비스에서 ValidationHelperUtils 로 본다 */
@Schema(description = "가입 요청 (고객사 워크스페이스 만들기)")
public record MemberSignupRequest(
        @Schema(description = "회사명", example = "한빛물류")
        @NotBlank @Size(max = 100) String organizationName,

        @Schema(description = "이메일(로그인 ID)", example = "admin@example.com")
        @NotBlank @Email @Size(max = 100) String email,

        @Schema(description = "비밀번호. 8~20자, 영문·숫자 포함", example = "Passw0rd!")
        @NotBlank String password
) {
}
