package com.marinbom2.logisticshubtwin.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

/**
 * 실제 필터 체인으로 가입 → 로그인 → 인증 → 권한 → 로그아웃 (FR-AU-001~003, md/authentication-security.md 12절).
 * MySQL 을 Testcontainers 로 띄운다. Docker 데몬이 없으면 건너뛴다.
 */
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create",
        "jwt.secret=test-secret-0123456789-abcdefghijklmnop",
        "security.role.self-change-allowed=true",
})
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class AuthFlowTest {

    private static final String PASSWORD = "Passw0rd!";
    private static final String COOKIE = "lht_at";

    @Container
    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    FilterChainProxy filterChainProxy;

    @Test
    @DisplayName("가입 = 워크스페이스(파일럿) + 관리자 → 로그인(HttpOnly·SameSite=Lax 쿠키) → 내 정보·워크스페이스")
    void signupLoginMe() throws Exception {
        String email = newEmail();

        mockMvc.perform(signup(email, PASSWORD))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.roleType.code").value("ADMIN"))
                .andExpect(jsonPath("$.organizationId").isNumber())
                .andExpect(jsonPath("$.password").doesNotExist());

        MvcResult login = mockMvc.perform(login(email, PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")))
                .andReturn();
        Cookie cookie = login.getResponse().getCookie(COOKIE);
        assertThat(cookie).isNotNull();

        mockMvc.perform(get("/api/v1/me").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
        mockMvc.perform(get("/api/v1/organization").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("테스트물류"))
                .andExpect(jsonPath("$.planType.code").value("PILOT"))
                .andExpect(jsonPath("$.pilotEndsAt").isNotEmpty());
    }

    @Test
    @DisplayName("가입 검증: 같은 이메일(대소문자 무시) 409 ALREADY_EXIST, 이메일 형식 400 + errors, 약한 비밀번호 400")
    void signupValidation() throws Exception {
        String email = newEmail();
        mockMvc.perform(signup(email, PASSWORD)).andExpect(status().isCreated());

        mockMvc.perform(signup(email.toUpperCase(), PASSWORD))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_EXIST"));

        mockMvc.perform(signup("not-an-email", PASSWORD))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_DATA"))
                .andExpect(jsonPath("$.errors[0].field").value("email"));

        mockMvc.perform(signup(newEmail(), "onlyletters"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_DATA"));
    }

    @Test
    @DisplayName("고객사 분리: 다른 고객사의 센터는 목록에 없고, 같은 코드도 각자 등록할 수 있다")
    void tenantIsolation() throws Exception {
        Cookie companyA = workspaceAdmin();
        Cookie companyB = workspaceAdmin();

        mockMvc.perform(registerCenter(companyA, "hub-y3"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("HUB-Y3"));
        mockMvc.perform(registerCenter(companyA, "HUB-Y3"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_EXIST"));

        mockMvc.perform(get("/api/v1/centers").cookie(companyB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(registerCenter(companyB, "HUB-Y3")).andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/centers").cookie(companyA))
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/v1/centers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("팀원: 관리자가 VIEWER·OPERATOR 를 발급, VIEWER 는 센터 등록·팀원 관리 403, 제어는 OPERATOR 부터 인가")
    void teamRoles() throws Exception {
        Cookie admin = workspaceAdmin();
        String viewerEmail = newEmail();
        String operatorEmail = newEmail();

        mockMvc.perform(addMember(admin, viewerEmail, "VIEWER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roleType.code").value("VIEWER"));
        mockMvc.perform(addMember(admin, operatorEmail, "OPERATOR")).andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/organization/members").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        Cookie viewer = loginCookie(viewerEmail);
        mockMvc.perform(registerCenter(viewer, "HUB-Z1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mockMvc.perform(get("/api/v1/organization/members").cookie(viewer)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/centers").cookie(viewer)).andExpect(status().isOk());
        mockMvc.perform(control(viewer)).andExpect(status().isForbidden());

        // 제어 API 는 M7 에서 생긴다. 지금은 인가만 통과하면 된다
        int status = mockMvc.perform(control(loginCookie(operatorEmail))).andReturn().getResponse().getStatus();
        assertThat(status).isNotIn(401, 403);
    }

    @Test
    @DisplayName("local 설정이면 내 권한 바꾸기: 권한은 DB 값이라 같은 쿠키로 바로 반영된다")
    void selfRoleChange() throws Exception {
        Cookie admin = workspaceAdmin();
        mockMvc.perform(patch("/api/v1/me/role").cookie(admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"roleType\":\"VIEWER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roleType.code").value("VIEWER"));
        mockMvc.perform(registerCenter(admin, "HUB-Q1")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("랜딩 API 는 로그인 없이: 투자 효과 추정 200, 도입 문의 201 / 동의 없으면 400")
    void publicSalesApis() throws Exception {
        mockMvc.perform(post("/api/v1/roi/estimates").contentType(MediaType.APPLICATION_JSON).content("""
                        {"hubCount":1,"departuresPerHubPerDay":60,"operatingDaysPerMonth":26,"lowLoadDeparturePercent":20,
                         "lowLoadAverageLoadPercent":70,"targetLoadPercent":90,"tripCostWon":400000,"jamMinutesPerHubPerDay":30,
                         "crewPerHub":20,"hourlyWageWon":15000,"improvementPercent":30}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlySavingWon").value(8_658_000))
                .andExpect(jsonPath("$.monthlyFeeWon").value(2_900_000));

        mockMvc.perform(post("/api/v1/leads").contentType(MediaType.APPLICATION_JSON).content(lead(true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.leadId").isNumber())
                .andExpect(jsonPath("$.email").doesNotExist());
        mockMvc.perform(post("/api/v1/leads").contentType(MediaType.APPLICATION_JSON).content(lead(false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("agreePrivacy"));
    }

    @Test
    @DisplayName("로그인 실패: 비밀번호 불일치·없는 계정 401 LOGIN_FAILED, JSON 아님 400 INVALID_REQUEST_DATA")
    void loginFailure() throws Exception {
        String email = newEmail();
        mockMvc.perform(signup(email, PASSWORD)).andExpect(status().isCreated());

        mockMvc.perform(login(email, "wrong-password1"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("LOGIN_FAILED"));
        mockMvc.perform(login("nobody-" + email, PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("LOGIN_FAILED"));
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.TEXT_PLAIN).content("email=a"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_DATA"));
    }

    @Test
    @DisplayName("인증 없음 401 UNAUTHORIZED, 위조 쿠키 401 INVALID_ACCESS_TOKEN")
    void unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.instance").value("/api/v1/me"));

        mockMvc.perform(get("/api/v1/me").cookie(new Cookie(COOKIE, "not.a.jwt")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_ACCESS_TOKEN"));
    }

    @Test
    @DisplayName("로그아웃: 204 + 쿠키 삭제(Max-Age=0), 그 전에 받은 토큰은 401 INVALID_ACCESS_TOKEN")
    void logoutRevokesTokens() throws Exception {
        String email = newEmail();
        mockMvc.perform(signup(email, PASSWORD)).andExpect(status().isCreated());
        Cookie cookie = loginCookie(email);

        mockMvc.perform(post("/api/v1/auth/logout").cookie(cookie))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));

        mockMvc.perform(get("/api/v1/me").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_ACCESS_TOKEN"));
    }

    @Test
    @DisplayName("시큐리티 체인 밖: 헬스체크와 API 문서는 인증 없이 열린다 (문서에 로그인 경로 포함)")
    void outsideSecurityChain() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/auth/login'].post.summary").value("로그인"));
    }

    @Test
    @DisplayName("체인은 API 하나. JWT 필터 → 로그인 필터 → 예외 변환 → 인가 순서다")
    void filterChainOrder() {
        assertThat(filterChainProxy.getFilterChains()).hasSize(1);
        List<String> filters = filterChainProxy.getFilterChains().getFirst().getFilters().stream()
                .map(filter -> filter.getClass().getSimpleName())
                .toList();

        assertThat(filters).containsSubsequence(
                "SecurityContextHolderFilter",
                "JwtAuthenticationFilter",
                "MemberAuthenticationAPIFilter",
                "AnonymousAuthenticationFilter",
                "ExceptionTranslationFilter",
                "AuthorizationFilter");
        assertThat(filters).doesNotContain("CsrfFilter", "LogoutFilter", "UsernamePasswordAuthenticationFilter",
                "BasicAuthenticationFilter", "RequestCacheAwareFilter");
    }

    private Cookie loginCookie(String email) throws Exception {
        return mockMvc.perform(login(email, PASSWORD)).andExpect(status().isOk())
                .andReturn().getResponse().getCookie(COOKIE);
    }

    private static RequestBuilder control(Cookie cookie) {
        return put("/api/v1/centers/y3/control").cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON).content("{\"inflowLevel\":3}");
    }

    /** 새 워크스페이스를 만들고 그 관리자로 로그인한 쿠키 */
    private Cookie workspaceAdmin() throws Exception {
        String email = newEmail();
        mockMvc.perform(signup(email, PASSWORD)).andExpect(status().isCreated());
        return loginCookie(email);
    }

    private static RequestBuilder signup(String email, String password) {
        return post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content("{\"organizationName\":\"테스트물류\",\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private static RequestBuilder registerCenter(Cookie cookie, String code) {
        return post("/api/v1/centers").cookie(cookie).contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"%s\",\"name\":\"용인 3센터\",\"region\":\"경기 남부\"}".formatted(code));
    }

    private static RequestBuilder addMember(Cookie cookie, String email, String role) {
        return post("/api/v1/organization/members").cookie(cookie).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\",\"roleType\":\"%s\"}".formatted(email, PASSWORD, role));
    }

    private static String lead(boolean agree) {
        return """
                {"companyName":"테스트물류","contactName":"홍길동","email":"ops@example.com","hubCount":3,
                 "message":"저적재 출발을 줄이고 싶습니다.","agreePrivacy":%s}
                """.formatted(agree);
    }

    private static RequestBuilder login(String email, String password) {
        return post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private static String newEmail() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }
}
