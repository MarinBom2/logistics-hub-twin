package com.marinbom2.logisticshubtwin.organization.api;

import com.marinbom2.logisticshubtwin.member.api.dto.MemberResponse;
import com.marinbom2.logisticshubtwin.member.application.MemberService;
import com.marinbom2.logisticshubtwin.member.domain.Member;
import com.marinbom2.logisticshubtwin.organization.api.dto.OrganizationResponse;
import com.marinbom2.logisticshubtwin.organization.api.dto.TeamMemberCreateRequest;
import com.marinbom2.logisticshubtwin.organization.application.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 내 고객사 워크스페이스. 항상 로그인한 회원의 고객사만 다룬다 (경로에 고객사 ID 를 받지 않는다) */
@Tag(name = "워크스페이스", description = "고객사 정보, 팀원 (SCR-03)")
@RestController
@RequestMapping("/api/v1/organization")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final MemberService memberService;

    @Operation(summary = "내 워크스페이스", description = "FR-OR-001. 회사명, 요금제, 파일럿 종료 시각")
    @GetMapping
    public OrganizationResponse get(@AuthenticationPrincipal Member member) {
        return OrganizationResponse.from(organizationService.get(member.getOrganizationId()));
    }

    @Operation(summary = "팀원 목록", description = "FR-OR-002. 관리자만")
    @GetMapping("/members")
    public List<MemberResponse> members(@AuthenticationPrincipal Member member) {
        return memberService.teamMembers(member.getOrganizationId()).stream().map(MemberResponse::from).toList();
    }

    @Operation(summary = "팀원 계정 발급", description = "FR-OR-002. 관리자만. 같은 고객사에 조회·운영자·관리자 계정을 만든다")
    @ApiResponse(responseCode = "409", description = "ALREADY_EXIST",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping("/members")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse addMember(@AuthenticationPrincipal Member member, @Valid @RequestBody TeamMemberCreateRequest request) {
        return MemberResponse.from(memberService.addTeamMember(
                member.getOrganizationId(), request.email(), request.password(), request.roleType()));
    }
}
