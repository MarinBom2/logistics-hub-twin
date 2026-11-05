package com.marinbom2.logisticshubtwin.center.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 센터 등록 (FR-CT-001). 코드는 수집기가 보내는 메시지의 센터 키가 된다 */
@Schema(description = "센터 등록 요청")
public record CenterCreateRequest(
        @Schema(description = "센터 코드. 영문 대문자·숫자·하이픈", example = "HUB-Y3")
        @NotBlank @Size(max = 30) @Pattern(regexp = "[A-Za-z0-9-]+", message = "영문·숫자·하이픈만 쓸 수 있습니다.") String code,

        @Schema(description = "센터 이름", example = "용인 3센터")
        @NotBlank @Size(max = 100) String name,

        @Schema(description = "지역", example = "경기 남부")
        @NotBlank @Size(max = 50) String region
) {
}
