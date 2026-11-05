package com.marinbom2.logisticshubtwin.sales.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** 접수 번호만 돌려준다. 입력한 개인정보는 되돌려 보내지 않는다 */
@Schema(description = "도입 문의 접수 결과")
public record LeadCreateResponse(@Schema(description = "접수 번호", example = "1") Long leadId) {
}
