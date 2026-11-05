package com.marinbom2.logisticshubtwin.member.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonFormat.Shape;
import com.marinbom2.logisticshubtwin.type.common.DescriptionCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 회원 역할. 권한 이름은 enum 이름 그대로 (ROLE_ 접두사 없음, md/authentication-security.md).
 * 관제 화면 조회는 모두, 제어 명령(유입량·집게차 대수)은 OPERATOR 이상만 (md/logistics-hub-twin.md §3).
 */
@Getter
@RequiredArgsConstructor
@JsonFormat(shape = Shape.OBJECT)
public enum RoleType implements DescriptionCode {

    VIEWER("조회"),
    OPERATOR("운영자"),
    ADMIN("관리자");

    private final String description;

    @Override
    public String getDescription() {
        return this.description;
    }
}
