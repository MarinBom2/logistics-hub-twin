package com.marinbom2.logisticshubtwin.center.api.dto;

import com.marinbom2.logisticshubtwin.center.domain.Center;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "센터")
public record CenterResponse(
        @Schema(description = "센터 ID", example = "1") Long centerId,
        @Schema(description = "센터 코드", example = "HUB-Y3") String code,
        @Schema(description = "센터 이름", example = "용인 3센터") String name,
        @Schema(description = "지역", example = "경기 남부") String region
) {

    public static CenterResponse from(Center center) {
        return new CenterResponse(center.getId(), center.getCode(), center.getName(), center.getRegion());
    }
}
