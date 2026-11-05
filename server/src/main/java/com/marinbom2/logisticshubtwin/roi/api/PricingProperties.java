package com.marinbom2.logisticshubtwin.roi.api;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * 요금 설정 ({@code pricing.*}). 값은 사업 가설이라 코드가 아니라 설정에 둔다 (md/business-plan.md §6).
 *
 * @param hubMonthlyFee 허브 요금제의 허브당 월 구독료 (원, 부가세 별도)
 */
@ConfigurationProperties("pricing")
public record PricingProperties(@DefaultValue("2900000") long hubMonthlyFee) {
}
