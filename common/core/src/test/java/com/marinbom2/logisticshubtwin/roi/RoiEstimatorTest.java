package com.marinbom2.logisticshubtwin.roi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RoiEstimatorTest {

    private static final long FEE = 2_900_000;

    /** 랜딩 계산기 기본값과 같은 예 (md/business-plan.md §4 표) */
    private static RoiInput sample(int hubs, int targetLoad, int improvement) {
        return new RoiInput(hubs, 60, 26, 20, 70, targetLoad, 400_000, 30, 20, 15_000, improvement);
    }

    @Test
    @DisplayName("기본 예: 저적재 2,496만 + 적체 390만 → 절감 30% 865.8만, 구독료 대비 2.9배")
    void sampleHub() {
        RoiEstimate result = RoiEstimator.estimate(sample(1, 90, 30), FEE);

        // 60 × 26 × 20% × 400,000 × (90 − 70)% = 24,960,000
        assertThat(result.monthlyLowLoadLossWon()).isEqualTo(24_960_000);
        // 30분 × 20명 × 15,000 × 26 = 3,900,000
        assertThat(result.monthlyJamLossWon()).isEqualTo(3_900_000);
        assertThat(result.monthlyLossWon()).isEqualTo(28_860_000);
        assertThat(result.monthlySavingWon()).isEqualTo(8_658_000);
        assertThat(result.annualSavingWon()).isEqualTo(103_896_000);
        assertThat(result.monthlyFeeWon()).isEqualTo(2_900_000);
        assertThat(result.netMonthlyBenefitWon()).isEqualTo(5_758_000);
        // 8,658,000 ÷ 2,900,000 = 2.985… → 내림 2.9
        assertThat(result.roiMultiple()).isEqualByComparingTo(new BigDecimal("2.9"));
    }

    @Test
    @DisplayName("허브 수에 비례한다")
    void scalesWithHubs() {
        RoiEstimate one = RoiEstimator.estimate(sample(1, 90, 30), FEE);
        RoiEstimate five = RoiEstimator.estimate(sample(5, 90, 30), FEE);

        assertThat(five.monthlySavingWon()).isEqualTo(one.monthlySavingWon() * 5);
        assertThat(five.monthlyFeeWon()).isEqualTo(FEE * 5);
        assertThat(five.roiMultiple()).isEqualByComparingTo(one.roiMultiple());
    }

    @Test
    @DisplayName("목표 적재율이 저적재 평균 이하(70 / 69)면 저적재 손실은 0, 경계 71 이면 1%p 만큼")
    void targetBoundary() {
        assertThat(RoiEstimator.estimate(sample(1, 70, 30), FEE).monthlyLowLoadLossWon()).isZero();
        assertThat(RoiEstimator.estimate(sample(1, 69, 30), FEE).monthlyLowLoadLossWon()).isZero();
        // 60 × 26 × 20% × 400,000 × 1% = 1,248,000
        assertThat(RoiEstimator.estimate(sample(1, 71, 30), FEE).monthlyLowLoadLossWon()).isEqualTo(1_248_000);
    }

    @Test
    @DisplayName("개선 비율 0% 면 절감 0, 순이익은 구독료만큼 음수")
    void noImprovement() {
        RoiEstimate result = RoiEstimator.estimate(sample(1, 90, 0), FEE);

        assertThat(result.monthlySavingWon()).isZero();
        assertThat(result.netMonthlyBenefitWon()).isEqualTo(-FEE);
        assertThat(result.roiMultiple()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("구독료가 0 이면 배수는 없음(null)")
    void zeroFee() {
        assertThat(RoiEstimator.estimate(sample(1, 90, 30), 0).roiMultiple()).isNull();
    }

    @Test
    @DisplayName("적체 분은 원 단위에서 내린다: 1분 × 1명 × 10,000원 × 1일 = 166.66… → 166")
    void jamRoundsDown() {
        RoiInput input = new RoiInput(1, 0, 1, 0, 0, 0, 0, 1, 1, 10_000, 100);

        assertThat(RoiEstimator.estimate(input, FEE).monthlyJamLossWon()).isEqualTo(166);
    }

    @Test
    @DisplayName("범위 밖 입력은 받지 않는다 (허브 0, 비율 101)")
    void rejectsOutOfRange() {
        assertThatThrownBy(() -> new RoiInput(0, 60, 26, 20, 70, 90, 400_000, 30, 20, 15_000, 30))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new RoiInput(1, 60, 26, 101, 70, 90, 400_000, 30, 20, 15_000, 30))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
