package com.marinbom2.logisticshubtwin.roi.api.dto;

import com.marinbom2.logisticshubtwin.roi.RoiInput;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** 투자 대비 효과 추정 요청 (FR-SL-001). 범위는 RoiInput 과 같다. 화면은 모르는 값에 기본값(가정)을 채워 보낸다 */
@Schema(description = "투자 대비 효과 추정 요청")
public record RoiEstimateRequest(
        @Schema(description = "허브 수", example = "1") @Min(1) @Max(500) int hubCount,
        @Schema(description = "허브당 하루 간선 출발 대수", example = "60") @Min(0) @Max(1000) int departuresPerHubPerDay,
        @Schema(description = "월 가동일", example = "26") @Min(1) @Max(31) int operatingDaysPerMonth,
        @Schema(description = "저적재 출발 비율 %", example = "20") @Min(0) @Max(100) int lowLoadDeparturePercent,
        @Schema(description = "저적재 출발 평균 적재율 %", example = "70") @Min(0) @Max(100) int lowLoadAverageLoadPercent,
        @Schema(description = "목표 적재율 %", example = "90") @Min(0) @Max(100) int targetLoadPercent,
        @Schema(description = "간선 1회 운행비 (원)", example = "400000") @Min(0) @Max(100_000_000) long tripCostWon,
        @Schema(description = "허브당 하루 적체 시간 (분)", example = "30") @Min(0) @Max(1440) int jamMinutesPerHubPerDay,
        @Schema(description = "적체 동안 대기하는 현장 인원", example = "20") @Min(0) @Max(1000) int crewPerHub,
        @Schema(description = "시간당 인건비 (원)", example = "15000") @Min(0) @Max(1_000_000) long hourlyWageWon,
        @Schema(description = "관제로 줄일 수 있는 손실 비율 % (가정)", example = "30") @Min(0) @Max(100) int improvementPercent
) {

    public RoiInput toInput() {
        return new RoiInput(hubCount, departuresPerHubPerDay, operatingDaysPerMonth, lowLoadDeparturePercent,
                lowLoadAverageLoadPercent, targetLoadPercent, tripCostWon, jamMinutesPerHubPerDay, crewPerHub,
                hourlyWageWon, improvementPercent);
    }
}
