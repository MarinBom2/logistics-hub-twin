package com.marinbom2.logisticshubtwin.member.api.dto;

import com.marinbom2.logisticshubtwin.member.domain.Member;
import com.marinbom2.logisticshubtwin.member.domain.RoleType;
import io.swagger.v3.oas.annotations.media.Schema;

/** 회원 정보 응답. 로그인 성공, 가입, 내 정보, 팀원 목록에서 같이 쓴다 (비밀번호·토큰 버전은 내보내지 않는다) */
@Schema(description = "회원 정보")
public record MemberResponse(
        @Schema(description = "회원 ID", example = "1") Long memberId,
        @Schema(description = "소속 고객사 ID", example = "1") Long organizationId,
        @Schema(description = "이메일(로그인 ID)", example = "admin@example.com") String email,
        @Schema(description = "권한. {code, description} 객체로 온다") RoleType roleType
) {

    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getOrganizationId(), member.getEmail(), member.getRoleType());
    }
}
