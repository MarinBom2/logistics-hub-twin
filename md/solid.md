# SOLID 원칙 — logistics-hub-twin 적용 가이드

> 목적: 백엔드(Spring Boot 4.1 / Java 21 / JPA / MySQL · Redis · RabbitMQ)와 프론트엔드(React 19 / TypeScript / React Three Fiber)를 작성할 때
> 지켜야 할 객체지향 설계 원칙과, 이 프로젝트에서의 구체적인 적용 기준을 정리한다.
> 바탕: 계약봄 solid.md 의 형식과 기준. 도메인 예시를 허브 관제(센터·분류구·이벤트·LLM 분석)로 바꿨다.
> 관련 문서: [develop-principal.md](./develop-principal.md), [logistics-hub-twin.md](./logistics-hub-twin.md) §5

## 한눈에 보기

| 원칙 | 이 프로젝트에서는 | 위반 신호 |
|---|---|---|
| **S** 단일 책임 | 함께 지켜야 하는 불변식(예: 이벤트 저장과 멱등 키, 파레트 적재 수와 만재 상태)은 한 클래스에 둔다. 단일 책임을 이유로 정합성 규칙을 쪼개지 않는다 | 한 규칙이 두 클래스에 나뉘어 한쪽만 고치면 깨짐 |
| **O** 개방-폐쇄 | 확장점은 인터페이스 하나 + 빈 하나. AI 추가는 `LlmProvider` 값 + `LlmClient` 구현체 + 조건부 빈. 설비 추가는 `FieldDataSource` 구현체 + 조건부 빈 | 공급자·설비가 늘 때마다 `switch`/`if`를 고침 |
| **L** 리스코프 치환 | 구현체를 바꿔도 호출부 규약이 같게 인터페이스에 못박는다 (없는 센터 조회는 예외가 아니라 `Optional.empty()`, 같은 `eventId` 저장은 무시, LLM 실패는 실패 결과 객체) | 호출부가 구현체 종류를 보고 분기 |
| **I** 인터페이스 분리 | 실제로 호출되는 메서드만. 나중에 쓸 것 같은 메서드를 미리 넣지 않는다 | 빈 구현, `UnsupportedOperationException` |
| **D** 의존관계 역전 | 기술 타입이 경계를 넘지 않는다. Redis 는 `state/redis`, RabbitMQ 는 `ingest/rabbit`, Spring AI 는 `llm/springai`, Milo 는 `source/opcua`, Paho 는 `publish/mqtt` 아래만 | 서비스가 `RedisTemplate`·`ChatClient`·Milo 타입을 import |

---

## S — 단일 책임 원칙

**변경 이유가 같은 것은 한곳에, 다른 것은 나눈다.** 이 프로젝트에서는 "변경 이유"보다 "같이 지켜야 하는 규칙"을 먼저 본다.

| 묶는다 (한 클래스) | 나눈다 |
|---|---|
| 이벤트 이력 저장 + `eventId` 유니크 판정 (`EventHistoryRepository` 구현체 하나) | 수신(`ingest/rabbit`) · 상태 갱신(`state`) · 실시간 푸시(`realtime`) |
| 파레트 적재 수 + 만재 → 집게차 대기 전환 (`Center`/`Lane` 도메인) | KPI 계산(`kpi`) · 알람 판정 |
| 회원 토큰 버전 + 무효화 (`Member.invalidateTokens`) | 토큰 서명·검증(`JwtTokenProvider`) · 쿠키 입출력(`AccessTokenCookie`) |

이미 지키는 예

- `AccessTokenCookie`: 인증 쿠키를 넣고 빼는 유일한 곳. 속성(HttpOnly, SameSite, Max-Age)이 발급·삭제에서 어긋나면 브라우저가 지우지 않으므로 한 클래스에 둔다.
- `ProblemDetails`: ErrorCode → ProblemDetail 변환은 한 곳. 컨트롤러 단계와 시큐리티 단계가 같이 쓴다.
- 프론트 `Center`(시뮬레이션)와 3D 부품(`scene/parts/*`): 데이터와 그리기를 나눈다. 3D 부품은 상태를 읽기만 한다.

---

## O — 개방-폐쇄 원칙

**확장점은 인터페이스 하나 + 빈 하나.** 새 구현은 클래스 추가와 조건부 빈 등록으로 끝나야 한다.

| 확장점 | 지금 / 예정 구현체 | 선택 방법 |
|---|---|---|
| `LlmClient` | Spring AI(Bedrock) | `llm.provider` (`LlmProvider` enum) + `@ConditionalOnProperty` |
| `FieldDataSource` (edge-collector) | OPC UA(Milo) → 이후 Modbus(PLC4X) | `collector.source` |
| `TelemetryPublisher` (edge-collector) | MQTT(Paho) | 하나뿐 |
| `CenterStateStore` | Redis | 하나뿐 (테스트는 인메모리) |
| `EventHistoryRepository` | JPA(MySQL) | 하나뿐 |

```java
// 공급자를 늘릴 때: enum 값 + 구현체 + 조건부 빈. 호출부(analysis)는 고치지 않는다
@Bean
@ConditionalOnProperty(name = "llm.provider", havingValue = "BEDROCK")
LlmClient bedrockLlmClient(ChatClient.Builder builder) { ... }
```

---

## L — 리스코프 치환 원칙

**규약은 인터페이스 Javadoc 에 적고, 모든 구현체가 같은 추상 테스트를 상속해 통과한다.**

| 인터페이스 | 규약 (구현체를 바꿔도 동일) |
|---|---|
| `CenterStateStore` | 없는 센터·분류구 조회는 예외가 아니라 `Optional.empty()` |
| `EventHistoryRepository` | 같은 `eventId` 저장은 무시 (멱등). 반환값으로 새로 저장했는지 알린다 |
| `LlmClient` | 응답 실패 시 예외가 아니라 실패 결과 객체 |
| `UserDetailsService` (지금 구현) | 없는 회원은 `UsernameNotFoundException`. 프로바이더가 비밀번호 불일치와 같은 예외로 바꿔 계정 존재 여부를 숨긴다 |

```java
// 추상 규약 테스트 하나를 구현체 테스트가 상속한다
abstract class CenterStateStoreContractTest {
    abstract CenterStateStore store();

    @Test void 없는_센터는_empty() { assertThat(store().find("nope")).isEmpty(); }
}
class RedisCenterStateStoreTest extends CenterStateStoreContractTest { ... }
```

---

## I — 인터페이스 분리 원칙

- 포트에는 **지금 호출되는 메서드만** 둔다. 화면이 부르지 않는 조회를 "나중에 쓸 것 같아서" 넣지 않는다.
- 이번 이식에서 지킨 예: 계약봄의 `AccessUserInfo`(컨트롤러 밖 로그인 회원 조회), 소셜 로그인, 이메일 인증은 쓰는 곳이 없어 가져오지 않았다. 클라이언트 `MemberApi`도 `me` 하나만 있다.
- 읽기와 쓰기 호출부가 다르면 인터페이스를 나눈다 (예: 화면용 `CenterStateQuery` / 수집용 `CenterStateWriter`). 하나의 구현체가 둘 다 구현해도 된다.

---

## D — 의존관계 역전 원칙

**포트(인터페이스)는 쓰는 쪽이 소유하고, 기술 타입은 어댑터 패키지 밖으로 나오지 않는다.**

```
center/ (도메인·포트)         ← CenterStateStore 를 소유
  ↑ 구현
state/redis/RedisCenterStateStore   ← RedisTemplate 은 여기만
```

- Gradle 로도 막는다: 기술 의존성은 `implementation`이라 다른 모듈에서 import 할 수 없다 (develop-principal.md §5).
- 메시지 → 도메인 변환은 어댑터에서 끝낸다. `@RabbitListener` 메서드가 받은 AMQP `Message`·헤더를 서비스로 넘기지 않는다.
- 예외: `Member`는 인증 주체라 spring-security-core 의 `UserDetails`를 구현한다 (계약봄과 같은 결정). 웹 시큐리티(필터 체인)는 server 에만 있다.

---

## 프론트엔드(React)에서의 SOLID

| 원칙 | 적용 |
|---|---|
| S | 시뮬레이션(`features/twin/sim`)은 데이터만, 3D(`features/twin/scene`)는 그리기만, 패널(`pages/dashboard/*`)은 스냅샷 표시만 |
| O | 3D 부품은 `scene/parts/*`에 하나씩 추가. `TwinScene`은 조립만 한다 |
| L | 패널은 `CenterSummary`·`CenterDetail` 스냅샷 타입만 안다. 브라우저 시뮬레이션이든 서버 실시간 채널(M4)이든 같은 타입을 채운다 |
| I | API 서비스(`authApi`, `memberApi`)는 화면이 부르는 함수만. mock 도 같은 인터페이스를 구현한다 |
| D | 화면은 `useHubNetwork` 훅에만 의존한다. 데이터 출처를 STOMP 로 바꿀 때 이 훅만 바뀐다 |

---

## 코드 리뷰 체크리스트

- [ ] 같이 지켜야 하는 규칙이 한 클래스에 있는가 (쪼개서 한쪽만 고치면 깨지지 않는가)
- [ ] 새 구현체 추가가 클래스 하나 + 조건부 빈으로 끝나는가
- [ ] 인터페이스 Javadoc 에 규약이 있고, 추상 규약 테스트를 상속하는가
- [ ] 인터페이스에 아직 호출되지 않는 메서드가 없는가
- [ ] Redis·RabbitMQ·Spring AI·Milo·Paho 타입이 어댑터 패키지 밖에 없는가
