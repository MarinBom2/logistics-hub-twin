package com.marinbom2.logisticshubtwin.member.api;

import com.marinbom2.logisticshubtwin.member.api.dto.MemberResponse;
import com.marinbom2.logisticshubtwin.member.api.dto.MemberSignupRequest;
import com.marinbom2.logisticshubtwin.member.application.MemberService;
import com.marinbom2.logisticshubtwin.member.domain.Member;
import com.marinbom2.logisticshubtwin.security.cookie.AccessTokenCookie;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCR-02: 가입(워크스페이스 만들기)·로그아웃. 로그인(POST /api/v1/auth/login)은 시큐리티 필터 MemberAuthenticationAPIFilter 가 처리한다.
 */
@Tag(name = "인증", description = "가입, 로그인, 로그아웃 (SCR-02)")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberService memberService;
    private final AccessTokenCookie accessTokenCookie;

    @Operation(summary = "가입 (워크스페이스 만들기)",
            description = "FR-AU-001. 회사명으로 고객사 워크스페이스(8주 파일럿)를 만들고, 가입한 사람을 관리자(ADMIN)로 둔다. 가입 뒤 로그인은 따로 한다")
    @ApiResponse(responseCode = "409", description = "ALREADY_EXIST",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse signUp(@Valid @RequestBody MemberSignupRequest request) {
        return MemberResponse.from(memberService.signUp(request.organizationName(), request.email(), request.password()));
    }

    @Operation(summary = "로그아웃",
            description = "FR-AU-002. 이 계정으로 발급한 토큰을 모두 무효로 만들고 인증 쿠키를 지운다. 토큰이 이미 만료됐어도 쿠키는 지운다")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal Member member, HttpServletResponse response) {
        if (member != null) {
            memberService.logout(member.getId());
        }
        accessTokenCookie.clear(response);
    }
}
