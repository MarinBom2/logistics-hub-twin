package com.marinbom2.logisticshubtwin.roi;

/**
 * 투자 대비 효과 추정 입력. 값은 고객사 현장 수치이고, 모르면 화면이 기본값(가정)을 넣는다 (md/business-plan.md §4).
 *
 * @param hubCount                  허브 수
 * @param departuresPerHubPerDay    허브당 하루 간선 출발 대수
 * @param operatingDaysPerMonth     월 가동일
 * @param lowLoadDeparturePercent   출발 중 저적재(목표 미만) 비율 %
 * @param lowLoadAverageLoadPercent 저적재 출발의 평균 적재율 %
 * @param targetLoadPercent         목표 적재율 %
 * @param tripCostWon               간선 1회 운행비 (원)
 * @param jamMinutesPerHubPerDay    허브당 하루 적체 시간 (분)
 * @param crewPerHub                적체 동안 대기하는 현장 인원
 * @param hourlyWageWon             인원 1명 시간당 인건비 (원)
 * @param improvementPercent        관제로 줄일 수 있다고 보는 손실 비율 % (파일럿에서 실측으로 바꾼다)
 */
public record RoiInput(
        int hubCount,
        int departuresPerHubPerDay,
        int operatingDaysPerMonth,
        int lowLoadDeparturePercent,
        int lowLoadAverageLoadPercent,
        int targetLoadPercent,
        long tripCostWon,
        int jamMinutesPerHubPerDay,
        int crewPerHub,
        long hourlyWageWon,
        int improvementPercent
) {

    public RoiInput {
        requireRange("hubCount", hubCount, 1, 500);
        requireRange("departuresPerHubPerDay", departuresPerHubPerDay, 0, 1000);
        requireRange("operatingDaysPerMonth", operatingDaysPerMonth, 1, 31);
        requireRange("lowLoadDeparturePercent", lowLoadDeparturePercent, 0, 100);
        requireRange("lowLoadAverageLoadPercent", lowLoadAverageLoadPercent, 0, 100);
        requireRange("targetLoadPercent", targetLoadPercent, 0, 100);
        requireRange("tripCostWon", tripCostWon, 0, 100_000_000);
        requireRange("jamMinutesPerHubPerDay", jamMinutesPerHubPerDay, 0, 1440);
        requireRange("crewPerHub", crewPerHub, 0, 1000);
        requireRange("hourlyWageWon", hourlyWageWon, 0, 1_000_000);
        requireRange("improvementPercent", improvementPercent, 0, 100);
    }

    private static void requireRange(String name, long value, long min, long max) {
        if (value < min || value > max) {
            throw new IllegalArgumentException(name + " 는 " + min + "~" + max + " 사이여야 합니다: " + value);
        }
    }
}
