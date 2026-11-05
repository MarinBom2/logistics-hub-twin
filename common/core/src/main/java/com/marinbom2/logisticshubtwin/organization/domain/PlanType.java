package com.marinbom2.logisticshubtwin.organization.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonFormat.Shape;
import com.marinbom2.logisticshubtwin.type.common.DescriptionCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 고객사 요금제 (md/business-plan.md §6). 가입하면 파일럿으로 시작한다 */
@Getter
@RequiredArgsConstructor
@JsonFormat(shape = Shape.OBJECT)
public enum PlanType implements DescriptionCode {

    PILOT("파일럿"),
    HUB("허브"),
    NETWORK("네트워크");

    private final String description;

    @Override
    public String getDescription() {
        return this.description;
    }
}
