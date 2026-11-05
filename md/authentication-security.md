# 인증과 시큐리티 — Spring Security 7 (Spring Boot 4) 구조

> 목적: 로그인·인증·인가가 **어디서 어떤 순서로** 일어나는지, Boot 기본 설정과 우리가 등록한 빈이 어떻게 맞물리는지 정리한다.
> 기준 버전: Spring Boot 4.1.2, Spring Security 7. 아래 필터 순서는 `AuthFlowTest.filterChainOrder`가 실행 중인 컨텍스트에서 확인하는 값이다.
> 바탕: 계약봄(gyeyakbom)의 회원 인증 구조. 로그인 필터·프로바이더·핸들러·JWT 필터·쿠키 전담 클래스 구성을 그대로 옮기고, 이 프로젝트에 필요 없는 소셜 로그인·이메일 인증·동의 기록은 빼고, 관제 권한(VIEWER · OPERATOR · ADMIN)을 넣었다 (10절).
> 관련 문서: [develop-principal.md](./develop-principal.md) §7·§8, [runtime-structure.md](./runtime-structure.md), [logistics-hub-twin.md](./logistics-hub-twin.md) §3·§8

## 한눈에 보기

| 항목 | 결정 |
|---|---|
| 로그인 | `POST /api/v1/auth/login` JSON `{email, password}`. 컨트롤러가 아니라 **시큐리티 필터**(`MemberAuthenticationAPIFilter`)가 처리 |
| 인증 주체 | `Member` 엔티티가 `UserDetails`를 구현해 그대로 principal 이 된다 |
| 토큰 | JWT(HS256), **HttpOnly 쿠키** `lht_at`, 유효 12시간. claim 은 회원 ID 와 토큰 버전뿐 |
| 로그아웃 | `Member.tokenVersion`을 1 올려 그 전에 발급한 토큰을 전부 무효화 |
| 권한 | 토큰이 아니라 요청마다 DB 의 현재 값. `VIEWER`(조회), `OPERATOR`(운영자), `ADMIN`(관리자). ROLE_ 접두사 없음 |
| 고객사 분리 | 회원은 고객사(Organization) 하나에 속한다. 모든 고객사 데이터 조회는 로그인한 회원의 고객사 ID 로 거른다 (9절) |
| 가입 | 가입 = 워크스페이스(고객사, 8주 파일럿) + 첫 관리자. 팀원은 관리자가 발급 |
| 인가 규칙 | 공개: 가입·로그인·로그아웃, 효과 계산기·도입 문의(랜딩). 관리자: 팀원 관리, 센터 등록. 운영자 이상: 제어. 나머지 `/api/**`는 로그인 필요 |
| 세션 | 없음 (STATELESS) |
| CSRF | 토큰 끔. SameSite=Lax 쿠키 + 같은 오리진 + CORS 없음으로 막는다 (6절) |
| 오류 | 401·403·로그인 실패 모두 ProblemDetail + `code` (`SecurityErrorResponder`) |
| 시큐리티가 맡는 경로 | `/api/**`만. 화면, `/actuator/health`, Swagger 는 체인을 타지 않는다 |

---

## 1. Boot 3 → Boot 4 에서 달라진 점

| 항목 | Boot 3 (Security 6) | Boot 4 (Security 7) |
|---|---|---|
| 설정 체이닝 | `.and()`로 이어 쓰기 | **제거**. 람다 DSL 만 (`http.csrf(c -> c.disable())`) |
| 인가 설정 | `authorizeRequests()` | **제거**. `authorizeHttpRequests()`만 |
| 경로 매처 | `AntPathRequestMatcher`, `MvcRequestMatcher` | **제거**. `PathPatternRequestMatcher`만 |
| JSON | `ObjectMapper` (Jackson 2) | `tools.jackson.databind.json.JsonMapper` (Jackson 3) |
| `UserDetails` | | 계정 상태 메서드 4개가 default(true). `getAuthorities`·`getPassword`·`getUsername`만 구현 |
| 자동 설정 위치 | `spring-boot-autoconfigure` 안 | `spring-boot-security` 모듈로 분리 |
| jjwt + Jackson | `jjwt-jackson` | `jjwt-jackson`은 Jackson 2 를 끌고 온다. 이 프로젝트는 `jjwt-gson` (develop-principal §4) |

처음 의존성(`build.gradle`)에 있던 `jjwt-jackson`은 이 이유로 `jjwt-gson`으로 바꿨다.

---

## 2. 요청이 시큐리티에 들어가는 길

```
Tomcat (서블릿 컨테이너)
  +- DelegatingFilterProxy  "springSecurityFilterChain"
  |     v
  |   FilterChainProxy
  |     +- apiSecurityFilterChain  securityMatcher("/api/**")   <- 우리가 등록한 유일한 체인
  |     |     DisableEncodeUrlFilter > WebAsyncManagerIntegrationFilter > SecurityContextHolderFilter
  |     |     > HeaderWriterFilter > JwtAuthenticationFilter > MemberAuthenticationAPIFilter
  |     |     > SecurityContextHolderAwareRequestFilter > AnonymousAuthenticationFilter
  |     |     > SessionManagementFilter > ExceptionTranslationFilter > AuthorizationFilter
  |     +- (맞는 체인이 없으면 시큐리티 필터를 하나도 거치지 않고 통과)
  v
DispatcherServlet -> 컨트롤러 -> @RestControllerAdvice
```

- 체인은 `/api/**`만 맡는다. 화면(`/`, `/centers/*`, `/assets/**`), `/actuator/health`, `/swagger-ui/**`, `/v3/api-docs`는 맞는 체인이 없어 시큐리티를 전혀 거치지 않는다.
- 꺼 둔 필터: `CsrfFilter`(6절), `LogoutFilter`(로그아웃은 컨트롤러), `UsernamePasswordAuthenticationFilter`(폼 로그인), `BasicAuthenticationFilter`, `RequestCacheAwareFilter`.
- 이후 STOMP(WebSocket, M4)를 붙이면 핸드셰이크 경로(`/ws/**`)를 이 체인에 넣을지 따로 정한다. 관제 구독은 조회라 공개, 제어 명령은 REST 로만 받는다.

---

## 3. 기본 빈과 우리가 등록한 빈

| Boot 기본 | 우리가 등록한 빈 | 결과 |
|---|---|---|
| `defaultSecurityFilterChain` (모든 요청 인증 + 폼 로그인 + HTTP Basic) | `apiSecurityFilterChain` | 물러남. 체인이 우리 것 하나뿐 (테스트로 확인) |
| `InMemoryUserDetailsManager` + 로그의 임시 비밀번호 | `memberAuthenticationManager`, `memberDetailsService` | 물러남 |
| `PasswordEncoder` 없음 | `passwordEncoder` (DelegatingPasswordEncoder, `{bcrypt}`) | 가입·로그인이 같은 인코더 |
| JSON 매퍼 (`JacksonAutoConfiguration`) | Boot 것을 주입받아 씀 | 로그인 필터·핸들러·오류 응답이 컨트롤러와 같은 설정 |

- **필터를 `@Component`로 만들지 않는다.** Boot 는 `Filter` 타입 빈을 서블릿 필터로도 자동 등록해 두 번 돈다. `SecurityConfig`에서 `new`로 만들어 체인에만 넣는다.

---

## 4. 로그인: 인증 매니저와 프로바이더

```
POST /api/v1/auth/login {"email","password"}
  |
MemberAuthenticationAPIFilter.attemptAuthentication
  |  Content-Type 확인, JSON 읽기, 이메일 정규화(Member.normalizeEmail)
  |  -> MemberAuthenticationToken.unauthenticated(email, password)
  v
ProviderManager (SecurityConfig.memberAuthenticationManager)
  v
MemberAuthenticationProvider.authenticate
  |  MemberDetailsService.loadUserByUsername(email) -> Member
  |  비밀번호 비교 (local 백도어 목록이면 건너뜀, 8절)
  v
성공: MemberLoginSuccessHandler          실패: SecurityErrorResponder
  JWT 발급 -> HttpOnly 쿠키                  JSON 형식 오류 -> 400 INVALID_REQUEST_DATA
  본문 MemberResponse (200)                  계정·비밀번호 불일치 -> 401 LOGIN_FAILED
```

- **매니저를 직접 빈으로 만드는 이유**: 로그인 필터가 쓰는 매니저와 프로바이더가 정확히 우리 것이어야 한다.
- **토큰 타입을 따로 두는 이유**: `ProviderManager`가 `supports()`로 이 토큰을 `MemberAuthenticationProvider`에만 보낸다. 다른 인증 방식(예: 설비 수집기용 API 키)을 붙이면 토큰 타입과 프로바이더를 하나씩 더한다.
- **계정 존재 여부를 숨긴다**: 없는 이메일과 비밀번호 불일치를 같은 `BadCredentialsException`으로 낸다. 없는 이메일일 때도 해시 비교를 한 번 해 응답 시간으로 구분되지 않게 한다.
- **로그인이 Swagger 에 보이게**: 필터라 springdoc 이 찾지 못하므로 `OpenApiConfig`가 경로를 직접 적는다.

---

## 5. 요청마다 인증: JWT 필터와 토큰 무효화

```
JwtAuthenticationFilter
  토큰 꺼내기: 쿠키 lht_at 우선, 없으면 Authorization: Bearer
    없음 -> 다음 필터 (공개 경로는 통과, 보호 경로는 뒤에서 401)
    있음 -> 서명·만료 검증 -> DB 에서 회원 조회 + tokenVersion 비교
            실패 -> 요청 속성에 INVALID_ACCESS_TOKEN 남기고 다음 필터
            성공 -> SecurityContext 에 Member 를 principal 로
ExceptionTranslationFilter / AuthorizationFilter
  인증 없음 + 보호 경로 -> 401 (남긴 이유가 있으면 그 code)
  권한 부족            -> 403 FORBIDDEN
```

| 결정 | 이유 |
|---|---|
| 필터는 응답을 쓰지 않는다 | 응답을 쓰는 곳을 `SecurityErrorResponder` 하나로. 관제 조회 같은 공개 경로는 만료된 쿠키가 붙어 와도 정상 동작한다 |
| 토큰에는 회원 ID 와 토큰 버전만 | 서명만 하고 암호화하지 않으므로 노출돼도 되는 값만 |
| 권한은 요청마다 DB 에서 | 운영자로 올리면 같은 토큰으로 바로 반영된다 (`AuthFlowTest.centerAuthorization`) |
| 로그아웃은 tokenVersion + 1 | 테이블 없이 숫자 하나로 모든 기기의 토큰을 무효화 |
| 운영에서 서명 키 필수 | `prod` 프로필에서 `jwt.secret`이 비면 기동을 멈춘다 (`JwtConfig`) |

principal 로 들어가는 `Member`는 트랜잭션 밖에서 읽은 준영속 객체다. 값을 바꿀 때는 ID 로 다시 읽어 서비스 트랜잭션 안에서 바꾼다 (`MemberService`). 컨트롤러에서는 `@AuthenticationPrincipal Member member`로 받는다.

---

## 6. CSRF와 쿠키

| 장치 | 효과 |
|---|---|
| 인증 쿠키 `SameSite=Lax` | 다른 사이트에서 시작된 POST·PUT·PATCH·DELETE 에는 쿠키가 실리지 않는다. 제어 명령(PUT)이 여기에 해당한다 |
| 상태를 바꾸는 GET 을 만들지 않는다 | Lax 는 링크로 들어오는 GET 에는 쿠키를 싣는다. 그래서 GET 은 조회만 |
| 같은 오리진 + CORS 설정 없음 | 화면과 API 가 한 오리진 (runtime-structure.md §4) |

- 쿠키 속성: `HttpOnly`, `Secure`(운영 true, local 은 http 라 false), `Path=/`, `Max-Age`=토큰 유효 기간, host-only. 쿠키를 넣고 빼는 곳은 `AccessTokenCookie` 하나다.

---

## 7. 오류 응답

| 자리 | 상황 | 응답 |
|---|---|---|
| `AuthenticationEntryPoint` | 인증 없이 보호 경로 (예: 로그인 없이 센터 목록) | 401 `UNAUTHORIZED` / JWT 필터가 남긴 이유가 있으면 401 `INVALID_ACCESS_TOKEN` |
| `AccessDeniedHandler` | 권한 부족 (VIEWER 가 제어 명령) | 403 `FORBIDDEN` (401 이면 클라이언트가 로그아웃시키므로 반드시 403) |
| `AuthenticationFailureHandler` | 로그인 실패 | 400 `INVALID_REQUEST_DATA`(형식) / 401 `LOGIN_FAILED` |

---

## 8. 개발용 백도어와 권한 바꾸기

| 기능 | 설정 (기본값) | 켜지는 조건 |
|---|---|---|
| 비밀번호 없이 로그인 | `security.login-bypass.emails` (빈 목록) | **local 프로필**이면서 목록에 이메일이 있을 때. 다른 프로필이면 무시하고 경고 로그 |
| 내 권한 바꾸기 `PATCH /api/v1/me/role` | `security.role.self-change-allowed` (false) | `application.yml`의 local 구간에서 true. 운영은 403 `FORBIDDEN` |

- 백도어 이메일은 저장소에 넣지 않는다. 쓰려면 `secrets/application-secret.yml`에 둔다.
- 로컬에서 운영자 화면을 볼 때: 가입 → 로그인 → `PATCH /api/v1/me/role {"roleType":"OPERATOR"}`.

---

## 9. 고객사 분리 (멀티테넌시)

| 규칙 | 어디서 |
|---|---|
| 회원은 고객사 하나에 속한다 (`Member.organizationId`, not null) | core `member.domain` |
| 경로로 고객사 ID 를 받지 않는다. 늘 `@AuthenticationPrincipal Member`의 고객사 | `OrganizationController`, `CenterController` |
| 서비스 메서드는 고객사 ID 를 첫 인자로 받고, 리포지토리 조회는 `findAllByOrganizationId…`처럼 고객사 ID 를 포함한다 | `CenterService`, `MemberService.teamMembers` |
| 다른 고객사의 데이터는 "없음"과 같다 (목록에 없고, 단건은 404) | `AuthFlowTest.tenantIsolation` |
| 센터 코드는 고객사 안에서만 유일하다 (`uk_center_org_code`) | 같은 `HUB-Y3`를 두 고객사가 각자 쓸 수 있다 |
| 이메일(로그인 ID)은 전체에서 유일하다 | 한 사람이 두 고객사에 속하려면 이메일을 따로 쓴다. 필요해지면 회원-고객사 연결 테이블로 바꾼다 |

M3 에서 붙는 상태(Redis)·이력(MySQL) 저장소도 키에 고객사를 넣는다: `hub:{organizationId}:{centerCode}:…`, `hub_event.organization_id`.

---

## 10. 클래스 목록

| 클래스 | 모듈·패키지 | 역할 |
|---|---|---|
| `Member`, `RoleType`, `MemberRepository` | core `member.domain` | 회원 엔티티 + `UserDetails`, 권한, 조회 |
| `BaseEntity` | core `domain.base` | `created_at`, `modified_at` (JPA Auditing) |
| `SecurityConfig` | server `security` | 필터 체인, 인가 규칙, 인증 매니저, `UserDetailsService`, `PasswordEncoder` |
| `MemberAuthenticationAPIFilter` | server `security.filter` | JSON 로그인 |
| `MemberAuthenticationToken` | server `security.token` | 로그인 요청 토큰 |
| `MemberAuthenticationProvider` | server `security.provider` | 비밀번호 검증, 백도어 |
| `MemberDetailsService` | server `security.details` | 이메일로 `Member` 조회 |
| `MemberLoginSuccessHandler` | server `security.handler` | JWT 쿠키 + 회원 정보 본문 |
| `JwtAuthenticationFilter` | server `security.filter` | 요청마다 토큰 확인 |
| `JwtTokenProvider`, `JwtProperties`, `JwtConfig` | server `security.jwt` | 발급·검증, 설정, 운영 키 확인 |
| `AccessTokenCookie` | server `security.cookie` | 쿠키 발급·삭제·읽기 |
| `SecurityErrorResponder` | server `security` | 401·403·로그인 실패 ProblemDetail |
| `MemberSecurityProperties` | server `security` | 백도어, 권한 바꾸기 설정 |
| `AuthController`, `MeController`, `MemberService` | server `member.api`, `member.application` | 가입(워크스페이스), 팀원 발급, 로그아웃, 내 정보, 권한 바꾸기 |
| `Organization`, `OrganizationController` | core `organization.domain`, server `organization.api` | 고객사, 내 워크스페이스, 팀원 |
| `Center`, `CenterController`, `CenterService` | core `center.domain`, server `center` | 고객사별 센터 |

API:

| 메서드 | 경로 | 인증 | FR |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | 없음 (워크스페이스 + 관리자) | FR-AU-001 |
| POST | `/api/v1/auth/login` | 없음 (필터) | FR-AU-002 |
| POST | `/api/v1/auth/logout` | 없음 (있으면 토큰 무효화, 항상 쿠키 삭제) | FR-AU-002 |
| GET | `/api/v1/me` | 필요 | FR-AU-002 |
| PATCH | `/api/v1/me/role` | 필요 (local 설정에서만) | FR-AU-003 |
| GET | `/api/v1/organization` | 필요 | FR-OR-001 |
| GET·POST | `/api/v1/organization/members` | `ADMIN` | FR-OR-002 |
| GET | `/api/v1/centers` | 필요 (내 고객사만) | FR-CT-001 |
| POST | `/api/v1/centers` | `ADMIN` | FR-CT-001 |
| * | `/api/v1/centers/*/control` | `OPERATOR`, `ADMIN` (M7 에서 구현) | FR-AU-003 |
| POST | `/api/v1/roi/estimates` | 없음 (랜딩) | FR-SL-001 |
| POST | `/api/v1/leads` | 없음 (랜딩) | FR-SL-002 |

---

## 11. 계약봄과 달라진 점

| 항목 | 계약봄 | 이 프로젝트 | 이유 |
|---|---|---|---|
| 가입 | 이메일 인증번호 → 가입, 동의 세 가지 | 회사명·이메일·비밀번호 → 워크스페이스 + 관리자 | B2B: 고객사 단위로 쓰고 팀원은 관리자가 발급 |
| 소셜 로그인 | 카카오·네이버 체인 | 없음 | 쓰는 곳이 없다 (solid.md I) |
| 권한 | USER, ADMIN, SYSTEM / 운영자 API `/api/v1/ops/**` | VIEWER, OPERATOR, ADMIN / 제어 API `/api/v1/centers/*/control` | 기획서 §3 "제어 명령은 인증 + 이력 기록" |
| 공개 API | 인증·가입만 | 인증·가입 + 효과 계산기·도입 문의 | 랜딩 페이지가 로그인 없이 부른다. 데모 관제는 서버를 부르지 않는다 |
| 쿠키 이름 | `gyeyakbom_at` | `lht_at` | |
| `AccessUserInfo` | 있음 | 옮기지 않음 | 컨트롤러 밖에서 로그인 회원을 꺼낼 곳이 아직 없다. 제어 감사 로그(M7)에서 필요하면 추가 |
| 비밀번호 규칙 | 6~20자, 두 종류 조합 | 8~20자, 영문·숫자 포함 | |

---

## 12. 테스트

| 테스트 | 확인하는 것 |
|---|---|
| `JwtTokenProviderTest` | 발급·검증 왕복, 만료, 위조·다른 키, 짧은 키 기동 실패, 빈 키 임시 동작 |
| `MemberAuthenticationProviderTest` | 성공, 계정 없음과 비밀번호 불일치가 같은 예외, 백도어, `supports` |
| `RoiEstimatorTest` (core) | 기본 예 금액, 허브 수 비례, 목표 적재율 경계(69·70·71), 개선 0%, 구독료 0, 원 단위 내림, 범위 밖 입력 |
| `SecurityErrorResponderTest` | 401·403 ProblemDetail, JWT 필터가 남긴 이유 반영 |
| `AuthFlowTest` (MySQL Testcontainers) | 가입(워크스페이스·관리자) → 로그인 쿠키 → 내 정보·워크스페이스, 가입 검증(409·400), **고객사 분리**, 팀원 권한(VIEWER 403·OPERATOR 제어 인가), 내 권한 바꾸기, 랜딩 공개 API, 로그인 실패, 무인증·위조 401, 로그아웃 후 토큰 거절, 체인 밖 경로, 필터 순서 |

Docker 가 없는 환경에서는 `AuthFlowTest`·`ServerApplicationTests`가 건너뛴다 (`disabledWithoutDocker`).

## 13. 정하지 않은 것

- [ ] 토큰 갱신(refresh). 지금은 12시간 토큰 하나, 만료되면 다시 로그인
- [ ] 로그인 실패 횟수 제한
- [ ] 관리자가 팀원의 권한을 바꾸거나 계정을 잠그는 API (`/api/v1/organization/members/{id}`)
- [ ] 팀원 초기 비밀번호를 첫 로그인 때 바꾸게 하기
- [ ] 랜딩 공개 API(계산기·문의) 요청 속도 제한
- [ ] 제어 명령 감사 로그(`control_audit`)에 요청자 기록 — M7
- [ ] edge-collector → 서버 인증은 사람 로그인과 다르다. RabbitMQ 사용자·vhost 권한으로 막는다 (M2·M3)
