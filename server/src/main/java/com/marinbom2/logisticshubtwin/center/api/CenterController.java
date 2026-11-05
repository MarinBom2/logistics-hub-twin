package com.marinbom2.logisticshubtwin.center.api;

import com.marinbom2.logisticshubtwin.center.api.dto.CenterCreateRequest;
import com.marinbom2.logisticshubtwin.center.api.dto.CenterResponse;
import com.marinbom2.logisticshubtwin.center.application.CenterService;
import com.marinbom2.logisticshubtwin.member.domain.Member;
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

/** 내 고객사의 센터. 실시간 상태·제어 API 는 M3·M7 에서 같은 경로 아래에 붙는다 */
@Tag(name = "센터", description = "센터 목록과 등록 (SCR-03)")
@RestController
@RequestMapping("/api/v1/centers")
@RequiredArgsConstructor
public class CenterController {

    private final CenterService centerService;

    @Operation(summary = "센터 목록", description = "FR-CT-001. 로그인한 회원의 고객사 센터만 코드 순으로")
    @GetMapping
    public List<CenterResponse> list(@AuthenticationPrincipal Member member) {
        return centerService.list(member.getOrganizationId()).stream().map(CenterResponse::from).toList();
    }

    @Operation(summary = "센터 등록", description = "FR-CT-001. 관리자만. 센터 코드는 고객사 안에서 유일하다")
    @ApiResponse(responseCode = "409", description = "ALREADY_EXIST",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CenterResponse register(@AuthenticationPrincipal Member member, @Valid @RequestBody CenterCreateRequest request) {
        return CenterResponse.from(centerService.register(member.getOrganizationId(), request.code(), request.name(), request.region()));
    }
}
