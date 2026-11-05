package com.marinbom2.logisticshubtwin.roi;

import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * 투자 대비 효과 계산 (md/business-plan.md §4). 돈 계산은 이 클래스 하나에서만 한다.
 *
 * 저적재 손실 = 허브 × 일 출발 × 가동일 × 저적재 비율 × 운행비 × (목표 적재율 − 저적재 평균 적재율)
 *   빈 공간만큼 운행비를 버린다고 본다. 목표가 평균 이하면 0
 * 적체 손실   = 허브 × 일 적체 시간 × 대기 인원 × 시간당 인건비 × 가동일
 * 절감액      = (저적재 손실 + 적체 손실) × 개선 비율
 * 원 단위 내림. 반올림 때문에 절감액이 부풀지 않게 한다
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class RoiEstimator {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal SIXTY = BigDecimal.valueOf(60);

    /** @param hubMonthlyFeeWon 허브 요금제의 허브당 월 구독료 (pricing.hub-monthly-fee) */
    public static RoiEstimate estimate(RoiInput in, long hubMonthlyFeeWon) {
        BigDecimal hubs = BigDecimal.valueOf(in.hubCount());
        BigDecimal days = BigDecimal.valueOf(in.operatingDaysPerMonth());

        int emptyPercent = Math.max(0, in.targetLoadPercent() - in.lowLoadAverageLoadPercent());
        BigDecimal lowLoad = hubs
                .multiply(BigDecimal.valueOf(in.departuresPerHubPerDay()))
                .multiply(days)
                .multiply(BigDecimal.valueOf(in.lowLoadDeparturePercent())).divide(HUNDRED)
                .multiply(BigDecimal.valueOf(in.tripCostWon()))
                .multiply(BigDecimal.valueOf(emptyPercent)).divide(HUNDRED);

        // 분 → 시간 나눗셈은 마지막에 한다. 중간에 자르면 원 단위 결과가 1원씩 어긋날 수 있다
        BigDecimal jam = hubs
                .multiply(BigDecimal.valueOf(in.jamMinutesPerHubPerDay()))
                .multiply(BigDecimal.valueOf(in.crewPerHub()))
                .multiply(BigDecimal.valueOf(in.hourlyWageWon()))
                .multiply(days)
                .divide(SIXTY, 0, RoundingMode.DOWN);

        long lowLoadWon = won(lowLoad);
        long jamWon = won(jam);
        long lossWon = lowLoadWon + jamWon;
        long savingWon = won(BigDecimal.valueOf(lossWon).multiply(BigDecimal.valueOf(in.improvementPercent())).divide(HUNDRED));
        long feeWon = in.hubCount() * hubMonthlyFeeWon;
        BigDecimal roi = feeWon == 0 ? null
                : BigDecimal.valueOf(savingWon).divide(BigDecimal.valueOf(feeWon), 1, RoundingMode.DOWN);

        return new RoiEstimate(lowLoadWon, jamWon, lossWon, savingWon, savingWon * 12, feeWon, savingWon - feeWon, roi);
    }

    private static long won(BigDecimal value) {
        return value.setScale(0, RoundingMode.DOWN).longValueExact();
    }
}
