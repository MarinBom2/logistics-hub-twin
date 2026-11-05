package com.marinbom2.logisticshubtwin.sales.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 도입 문의 (FR-SL-002). 예시 값은 가짜다 */
@Schema(description = "도입 문의 요청")
public record LeadCreateRequest(
        @Schema(description = "회사명", example = "한빛물류") @NotBlank @Size(max = 100) String companyName,
        @Schema(description = "담당자 이름", example = "홍길동") @NotBlank @Size(max = 50) String contactName,
        @Schema(description = "업무 이메일", example = "ops@example.com") @NotBlank @Email @Size(max = 100) String email,
        @Schema(description = "운영 중인 허브 수", example = "3") @Min(1) @Max(500) int hubCount,
        @Schema(description = "문의 내용", example = "간선 저적재 출발을 줄이고 싶습니다.") @Size(max = 1000) String message,
        @Schema(description = "개인정보 수집·이용 동의", example = "true")
        @AssertTrue(message = "개인정보 수집·이용에 동의해 주세요.") boolean agreePrivacy
) {
}
