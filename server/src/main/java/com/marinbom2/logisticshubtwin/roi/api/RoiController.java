package com.marinbom2.logisticshubtwin.roi.api;

import com.marinbom2.logisticshubtwin.roi.RoiEstimate;
import com.marinbom2.logisticshubtwin.roi.RoiEstimator;
import com.marinbom2.logisticshubtwin.roi.api.dto.RoiEstimateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 랜딩 페이지의 투자 대비 효과 계산기. 로그인 없이 부른다. 저장하지 않는다 */
@Tag(name = "투자 효과", description = "투자 대비 효과 계산기 (SCR-00)")
@RestController
@RequestMapping("/api/v1/roi")
@RequiredArgsConstructor
@EnableConfigurationProperties(PricingProperties.class)
public class RoiController {

    private final PricingProperties pricing;

    @Operation(summary = "투자 대비 효과 추정",
            description = "FR-SL-001. 저적재 출발·적체 손실과 예상 절감액을 허브 요금제 구독료와 비교한다. 결과는 가정에 기댄 추정이다")
    @PostMapping("/estimates")
    public RoiEstimate estimate(@Valid @RequestBody RoiEstimateRequest request) {
        return RoiEstimator.estimate(request.toInput(), pricing.hubMonthlyFee());
    }
}
