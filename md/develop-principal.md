# 개발 규약 — logistics-hub-twin 코드 작성 규칙

> 목적: SOLID 같은 일반 원칙이 아니라, 이 프로젝트에서 코드를 쓸 때 **매번 같은 방식으로** 해야 하는 구체적인 규칙을 모은다.
> 새 규칙이 정해지면 이 문서에 먼저 추가하고, 기존 코드는 해당 영역을 건드릴 때 맞춘다.
> 바탕: 계약봄(gyeyakbom) 프로젝트의 개발 규약. 모듈 구조·오류 형식·인증 구성을 그대로 따르고 이 프로젝트 도메인(허브 관제)에 맞춰 바꿨다.
> 관련 문서: [logistics-hub-twin.md](./logistics-hub-twin.md)(기획서), [solid.md](./solid.md), [authentication-security.md](./authentication-security.md), [runtime-structure.md](./runtime-structure.md), [HARNESS.md](./HARNESS.md)

## 한눈에 보기

| 영역 | 규칙 | 근거 |
|---|---|---|
| 모듈 | 도메인·공통 yml은 `common:core`, API·보안은 `server`, 배치는 `batch`, 화면은 `client`. 앱 모듈끼리 의존하지 않는다 | server·batch가 같은 도메인을 씀 |
| enum | 모든 enum은 `DescriptionCode`를 구현하고 한글 `description`을 가진다. 프론트에는 `{code, description}`으로 내려간다 | 표시 문구를 서버 한 곳에서 관리 |
| 예외 | 도메인 규칙 위반 예외는 해당 도메인 패키지(`*.domain.exception`)에 둔다. 모두 unchecked | 의존 방향(domain이 바깥을 모름), 자동 롤백 |
| API 응답·오류 | 성공은 DTO 그대로, 오류는 ProblemDetail(RFC 9457) + `code`(`ErrorCode`). 시큐리티 401/403도 같은 형식 | 표준 형식. 성공 여부는 HTTP 상태 하나로 |
| API 경로·문서 | 모든 API는 `/api/v1/...`. 컨트롤러에 `@Tag`, 메서드에 FR ID로 시작하는 `@Operation` | 프록시·포워딩·시큐리티가 `/api` 접두사 기준 |
| 요구사항 추적 | 코드에 `FR-…`, `SCR-…` ID를 주석·라우트 이름에 남긴다 | 요구사항 표·화면 목록을 코드에서 뽑음 |
| JWT | jjwt 0.13 + `jjwt-gson`. `jjwt-jackson`은 쓰지 않는다 | Boot 4의 Jackson 3(`tools.jackson`)와 Jackson 2가 섞임 |
| 시간 | 현재 시각은 `Clock` 빈으로 얻는다. `Instant.now()`를 직접 부르지 않는다 | 토큰 만료·출발 마감 같은 시간 규칙을 테스트에서 고정 |
| 비밀 값 | `src/main/resources`에 두지 않는다. 로컬은 루트 `secrets/`, 운영은 환경변수 | resources에 두면 jar·Docker 이미지에 들어감 |
| 기술 타입 경계 | Redis·RabbitMQ·Spring AI·Milo·Paho 타입은 각자의 어댑터 패키지(`state/redis`, `ingest/rabbit`, `llm/springai` …) 밖으로 나가지 않는다 | 구현체 교체가 빈 하나 바꾸기로 끝나게 (solid.md D) |
| 주석 | 필요한 곳에만 한두 줄. 날짜를 넣지 않는다. HTML 태그를 쓰지 않는다. 긴 설명은 md 문서에 | 날짜·경위는 git 기록과 md 문서가 맡는다 |
| 커밋 | `타입: 한글 요약`. AI 작성 표기를 넣지 않는다 | [HARNESS.md](./HARNESS.md) |

---

## 1. enum: code + description

### 규칙

- 서버의 **모든 enum**은 `com.marinbom2.logisticshubtwin.type.common.DescriptionCode`를 구현한다.
- 한글 `description` 필드를 가진다. 화면에 그대로 나가는 문구다.
- `@JsonFormat(shape = Shape.OBJECT)`를 붙여 `{"code": "OPERATOR", "description": "운영자"}` 형태로 직렬화한다.
- 클라이언트는 `code`로 분기·비교하고 `description`으로 표시한다. 프론트에 같은 한글 문구를 다시 정의하지 않는다.

### 서버 작성 형태

```java
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
```

### 클라이언트 타입 형태

```ts
// client/src/shared/types/common.ts
export interface CodeLabel<C extends string = string> {
  code: C
  description: string
}
```

### 주의

- JPA 칼럼은 `@Enumerated(EnumType.STRING)`. `NoColumnCheckMySQLDialect`가 varchar로, CHECK 제약 없이 만든다. 네이티브 `enum(...)`이면 ddl-auto=update에서 값을 추가할 때 저장이 막힌다 (이벤트 종류가 계속 늘어나는 도메인이라 특히 중요).

---

## 2. 예외

| 종류 | 위치 | 응답 |
|---|---|---|
| 애플리케이션 예외 | `BusinessException(ErrorCode, 화면 문장)` (`common:core` `exception`) | `GlobalExceptionHandler`가 ProblemDetail로 |
| 도메인 규칙 위반 | `{도메인}.domain.exception` (예: 나중에 `center.domain.exception`) | 핸들러에 매핑을 하나 추가 |
| 시큐리티 단계 | 필터에서 난다 | `SecurityErrorResponder`가 같은 형식으로 |

- 모두 `RuntimeException`. 체크 예외로 감싸 던지지 않는다.
- `BusinessException`의 메시지는 화면에 그대로 나간다. 내부 정보(SQL, 클래스 이름, 다른 회원 정보)를 넣지 않는다.
- 예상하지 못한 예외는 `INTERNAL_ERROR` 한 가지 문구만 내보내고 스택은 로그로만 남긴다.

---

## 3. 요구사항·화면 ID와 주석

| ID | 뜻 | 쓰는 곳 |
|---|---|---|
| `FR-AU-001` | 가입 | `AuthController.signUp`, `MemberService.signUp` |
| `FR-AU-002` | 로그인·로그아웃·세션 확인 | 로그인 필터, `AuthController.logout`, `MeController.me` |
| `FR-AU-003` | 권한 (VIEWER · OPERATOR · ADMIN) | `SecurityConfig`, `MeController.changeRole` |
| `SCR-01` | 관제 화면 (네트워크·KPI·3D·도크·이벤트) | `client/src/routes.ts` `SCR01_DASHBOARD` |
| `SCR-02` | 로그인·가입 | `client/src/routes.ts` `SCR02_LOGIN` |

- 수집(M3)·제어(M7)·분석(M8) 기능이 생기면 `FR-CT-…`(관제), `FR-CM-…`(제어), `FR-AN-…`(분석)처럼 영역별 접두사로 이어 붙인다.
- 주석은 "왜"만. "무엇"은 이름으로 드러낸다.

---

## 4. 의존성 결정 기록

| 의존성 | 결정 | 이유 |
|---|---|---|
| Spring Boot | 4.1.2, Java 21 | Spring Security 7 람다 DSL, Jackson 3 |
| jjwt | `jjwt-api` + `jjwt-impl` + **`jjwt-gson`** | `jjwt-jackson`은 Jackson 2(`com.fasterxml.jackson.databind`)를 끌어와 Boot 4의 Jackson 3와 두 벌이 섞인다 |
| springdoc | 3.2.0 | 3.x가 Boot 4 라인 |
| Testcontainers | MySQL 8.4 | 실제 DB 스키마로 인증 흐름 확인. Docker가 없으면 건너뛴다 (`disabledWithoutDocker`) |
| 3D | three + `@react-three/fiber` + `@react-three/drei` | 기획서 §4. 프로토타입(three r128 직접 호출)을 선언형으로 옮김 |
| 글꼴 | `@fontsource/ibm-plex-sans-kr`, `@fontsource/jetbrains-mono` | 외부 CDN 없이 jar에 함께 담긴다. 한글은 유니코드 구간별로 나뉜 파일만 받는다 |

---

## 5. 모듈 구조

```
logistics-hub-twin (루트 build.gradle: 플러그인 버전 + Java 모듈 공통 설정만)
 +- common/core   java-library. 도메인(member, 이후 center·event), 공통 설정·yml. bootJar 끔
 +- server        Boot 실행 jar. API·보안·화면(client dist 포함). core 의존
 +- batch         Boot 실행 jar. 이력 정리·집계 배치. core 의존. server 는 의존하지 않는다
 +- client        Vite + React + R3F (node-gradle). server 의 bootJar 가 dist 를 static/ 으로 담는다
 (예정) plc-sim, edge-collector   M1·M2 에서 추가. server·core 와 코드를 공유하지 않고 MQTT 메시지로만 이어진다
```

- 앱 클래스(`ServerApplication`, `BatchApplication`)는 `com.marinbom2.logisticshubtwin` 루트에 둬서 core의 엔티티·설정까지 스캔한다.
- 설정 파일 `application*.yml`은 core에만 둔다. server·batch에 같은 이름의 파일을 두면 클래스패스에서 하나만 읽혀 core 설정(DB·JWT)이 사라진다. 모듈마다 다른 값은 main 클래스의 `setDefaultProperties`로 넣는다 (예: batch의 `spring.main.web-application-type=none`).
- core는 도메인이 드러내는 JPA·Jackson·spring-security-core만 `api`로 내보낸다. 이후 붙는 Redis·RabbitMQ·Spring AI는 `implementation`이라 다른 모듈에서 그 타입을 import할 수 없다.
- 빌드는 루트에서 한다. 화면을 어디에 담는지와 `-PskipClient`·`-PwithClient` 플래그는 [runtime-structure.md](./runtime-structure.md).

```bash
./gradlew build -PskipClient      # Windows: .\gradlew.bat build -PskipClient
```

### 패키지 (기획서 §5.3 반영)

```
com.marinbom2.logisticshubtwin
├── config/           Clock, JPA Auditing, MySQL 방언 (core) · OpenAPI, SPA 포워딩 (server)
├── domain/base/      BaseEntity (core)
├── exception/        BusinessException (core) · GlobalExceptionHandler, ProblemDetails (server)
├── type/common/      DescriptionCode, ErrorCode (core)
├── member/
│   ├── domain/       Member, RoleType, MemberRepository (core)
│   ├── api/          AuthController, MeController, dto (server)
│   └── application/  MemberService (server)
├── security/         JWT·쿠키·필터 (server, authentication-security.md)
│
│   ── 이후 단계 ──
├── center/  event/  kpi/  control/  analysis/     도메인·유스케이스 (core / server)
├── ingest/rabbit/  state/redis/  history/jpa/  realtime/stomp/  llm/springai/   어댑터
└── batch/            배치 작업 (batch)
```

---

## 6. 비밀 값

| 값 | 로컬 | 운영 |
|---|---|---|
| DB 접속 | `application.yml` 기본값(docker-compose MySQL, `DB_PASSWORD` 기본 root) | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| JWT 서명 키 | 루트 `secrets/application-secret.yml`의 `jwt.secret` (없으면 기동마다 임시 키) | `JWT_SECRET` (없으면 기동 실패) |

- `secrets/`는 gitignore이고, server·batch의 `bootRun` 클래스패스에만 붙는다. jar에는 들어가지 않는다.
- `application.yml`은 `optional:classpath:application-secret.yml`을 import한다. 로컬은 파일로, 운영은 환경변수로 같은 키를 채운다.
- 새 비밀 값이 생기면 이 표에 행을 추가하고 `application-prod.yml` 머리 주석의 환경변수 목록도 고친다.

```yaml
# secrets/application-secret.yml (커밋하지 않는다)
jwt:
  secret: 32바이트-이상의-임의-문자열을-여기에-넣는다
```

---

## 7. API 응답과 오류 (ProblemDetail)

### 형식

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.",
  "instance": "/api/v1/me",
  "code": "INVALID_ACCESS_TOKEN"
}
```

- 성공 응답에는 봉투(`{success, data}`)를 씌우지 않는다. DTO 그대로.
- 입력값 검증 실패(`INVALID_REQUEST_DATA`)는 `errors: [{field, message}]`를 더한다.
- Spring이 직접 낸 404·405 등에도 `ErrorCode.defaultFor(status)`로 `code`와 한글 문구를 입힌다.

### 서버 구성

| 클래스 | 역할 |
|---|---|
| `ErrorCode` (core) | 상태·화면 문구. 클라이언트 분기 기준 |
| `ProblemDetails` (server) | ErrorCode → ProblemDetail을 만드는 유일한 곳 |
| `GlobalExceptionHandler` (server) | 컨트롤러 단계 |
| `SecurityErrorResponder` (server) | 시큐리티 단계 401·403·로그인 실패 |

### 클라이언트

| 파일 | 역할 |
|---|---|
| `shared/types/common.ts` | `ProblemDetail`, `FieldError`, `CodeLabel` (서버와 1:1) |
| `shared/core/apiClient.ts`의 `apiRequest` | 모든 호출의 공통 수신부. 2xx면 DTO 그대로, 아니면 `ApiError`. 401이면 세션 만료를 알린다 |
| `shared/utils/common/errorMessage.ts` | 화면에 보여 줄 문장 하나를 고른다 |

### 테스트

- `SecurityErrorResponderTest`: Boot의 `JsonMapper`로 401·403을 썼을 때 같은 형식인지.
- `AuthFlowTest`: 실제 필터 체인으로 401·403·로그인 실패·로그아웃 뒤 토큰 거절·필터 순서 (authentication-security.md 11절).

---

## 8. 컨트롤러와 API 경로 (Swagger)

| 대상 | 경로 | 예 |
|---|---|---|
| 인증 | `/api/v1/auth/...` | `/api/v1/auth/login`, `/api/v1/auth/logout` |
| 내 정보 | `/api/v1/me` | `/api/v1/me/role` |
| 관제 조회 | `/api/v1/centers/...` | `/api/v1/centers`, `/api/v1/centers/{centerId}/snapshot` |
| 제어 | `/api/v1/centers/{centerId}/control` | 운영자 이상 |
| 분석 | `/api/v1/analysis/...` | `/api/v1/analysis/ask` |

- 기획서 §8의 `/api/centers`는 이 규칙에 따라 `/api/v1/centers`로 둔다.
- 리소스는 복수 명사, 여러 단어면 kebab-case. 동작은 동사 경로 대신 HTTP 메서드로.
- 컨트롤러 클래스에 `@Tag(name, description)`(description에 SCR ID), 메서드에 `@Operation(summary, description)`(description은 FR ID로 시작).
- 엔드포인트 고유 오류만 `@ApiResponse`로 적는다. 공통 오류(401·403·500)는 적지 않는다.
- 로컬 문서: `http://localhost:9090/swagger-ui.html`. 운영은 `application-prod.yml`에서 끈다.

---

## 9. 작업 순서

1. 기획서(logistics-hub-twin.md)의 단계(M0~M9)와 이 문서를 확인한다.
2. 새 영역은 뼈대(패키지·인터페이스 시그니처)를 먼저 잡고 리뷰한 뒤 구현을 채운다.
3. 포트 규약(없는 값은 `Optional.empty()`, 같은 `eventId`는 무시 등)을 인터페이스 Javadoc에 먼저 적는다.
4. 테스트 → 구현 → 문서 갱신 순으로 커밋한다.

---

## 코드 리뷰 체크리스트

- [ ] 새 enum이 `DescriptionCode`를 구현하고 `@JsonFormat(shape = OBJECT)`인가
- [ ] 오류가 `BusinessException`이나 도메인 예외로 나가고, 메시지에 내부 정보가 없는가
- [ ] 새 API가 `/api/v1/` 아래이고 `@Tag`·`@Operation`(FR ID)이 있는가
- [ ] 외부 기술 타입이 어댑터 패키지 밖으로 나가지 않는가
- [ ] 현재 시각을 `Clock`으로 얻는가
- [ ] 비밀 값이 `src/main/resources`에 없는가
- [ ] 커밋 메시지가 `타입: 한글 요약`이고 AI 작성 표기가 없는가
