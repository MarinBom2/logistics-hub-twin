package com.marinbom2.logisticshubtwin.roi;

import java.math.BigDecimal;

/**
 * 투자 대비 효과 추정 결과 (원, 월 기준).
 *
 * @param roiMultiple 월 절감액 ÷ 월 구독료 (소수 첫째 자리, 내림). 구독료가 0 이면 null
 */
public record RoiEstimate(
        long monthlyLowLoadLossWon,
        long monthlyJamLossWon,
        long monthlyLossWon,
        long monthlySavingWon,
        long annualSavingWon,
        long monthlyFeeWon,
        long netMonthlyBenefitWon,
        BigDecimal roiMultiple
) {
}
