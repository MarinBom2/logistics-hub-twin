# logistics-hub-twin

물류 허브 상하차 관제 시스템 (WCS · TMS 도메인) — 사이드 프로젝트 개발 기획서

- GitHub: `MarinBom2/logistics-hub-twin` (Public)
- Group: `com.marinbom2`
- 프로토타입 (3D 관제 화면): https://claude.ai/artifact/5PMZUELTEWN5YfnFj21bsM

> 이 프로젝트는 허브 상하차 1일 아르바이트 체험을 바탕으로 한 개인 학습용 프로젝트이며, 특정 기업과 무관합니다. 화면과 데이터의 센터 구성, 처리량, 목적지는 모두 시뮬레이션 값입니다.

---

## 1. 목표

- 레일 유입부터 간선 트럭 출발까지 허브 공정이 **실시간으로 굴러가는 관제 화면**을 만든다.
- 실제 현장과 같은 경로로 데이터를 흘린다: **가상 PLC(OPC UA) → 엣지 수집기 → MQTT → Spring Boot → React 3D**
- 여러 센터(용인 3센터, 용인 5센터, 이천 센터 …)를 지역별로 묶어 동시에 관제한다.
- 쌓인 이벤트 이력을 LLM으로 분석해 "왜 막혔는지"를 답하는 기능을 붙인다.

### 포트폴리오 포인트

| 축 | 보여주는 역량 | 연결되는 직무 |
|---|---|---|
| 설비 수집 → 관제 | OPC UA, MQTT, 메시징, 실시간 상태 관리, 3D 디지털 트윈 | MES · WCS · 물류 IT 개발 |
| 이벤트 데이터 + LLM | 이력 집계, 근거 기반 LLM 응답 | 제조 · 물류 DX, 클라우드 |

---

## 2. 도메인

### 2.1 공정 흐름 (허브 상하차)

```
레일 유입 → 스캔 터널(송장 판독) → 분기 레일(A~F) → 분류구 파레트 적재
→ 집게차 이송 → 래핑 → 도크 상차 → 간선 트럭 출발
```

- 판독 실패(NO READ) 박스는 메인 레일 끝 **리젝트 슈트**로 빠진다.
- 분기 레일 입구가 꽉 차면 해당 박스는 진입하지 못하고 **재순환**된다.
- 파레트가 만재되면 집게차를 호출하고, 집게차가 올 때까지 분기 레일에 박스가 줄을 선다. 6개 이상 정체되면 **적체**로 본다.

### 2.2 시스템 계층에서의 위치 (ISA-95)

| 계층 | 시스템 | 이 프로젝트 |
|---|---|---|
| 3 | MES / WMS / TMS | 상차 실적, 도크·트럭 관리 (`server`) |
| 2 | SCADA / WCS | 레일·분류·적체 관제 (`server` + `client`) |
| 1 | PLC | 가상 PLC (`plc-sim`) |
| 0 | 센서 · 모터 | `plc-sim` 내부 시뮬레이션 |

### 2.3 핵심 엔티티

| 엔티티 | 주요 속성 |
|---|---|
| `Center` | centerId(`y3`, `y5`, `ic`), 이름, 코드(`HUB-Y3`), 지역 |
| `Lane` (분류구) | 코드(A~F), 목적지명, 파레트 적재 수, 상태(적재중 / 집게차 대기 / 적체), 분기 레일 대기 수 |
| `Parcel` | 송장번호, 목적지 분류구, 판독 결과 |
| `Pallet` | 적재 수량(최대 27), 상태(적재중 → 래핑대기 → 래핑완료 → 상차완료) |
| `Forklift` | 위치, 작업 단계(이송 / 래핑 / 도크 상차), 담당 분류구 |
| `Dock` / `Truck` | 도크 번호, 적재율, 출발 예정 시각, 상태(진입 / 상차 / 출발) |

### 2.4 이벤트

| 이벤트 | 발생 시점 |
|---|---|
| `PARCEL_SCANNED` | 스캔 터널 통과 (판독 성공) |
| `PARCEL_NO_READ` | 판독 실패 |
| `PARCEL_DIVERTED` | 분기 레일 진입 |
| `PARCEL_RECIRCULATED` | 분기 레일 만재로 진입 실패 |
| `PARCEL_REJECTED` | 리젝트 슈트 도착 |
| `PARCEL_SORTED` | 파레트 적재 |
| `PALLET_FULL` | 파레트 만재 → 집게차 호출 |
| `FORKLIFT_ASSIGNED` | 집게차 배정 |
| `PALLET_WRAPPED` | 래핑 완료 |
| `PALLET_LOADED` | 트럭 상차 |
| `LANE_JAMMED` / `LANE_JAM_CLEARED` | 적체 발생 / 해소 |
| `TRUCK_DOCKED` / `TRUCK_DEPARTED` | 트럭 접안 / 출발 |
| `GATEWAY_OFFLINE` | 수집기 통신 끊김 (MQTT Last Will) |

공통 필드: `eventId`(UUID), `centerId`, `type`, `occurredAt`, `payload`

### 2.5 KPI · 알람

| KPI | 정의 |
|---|---|
| 시간당 분류량 (PPH) | 최근 60초 분류 수 × 60 |
| 송장 판독률 | (스캔 − NO READ) / 스캔 |
| 적체 분류구 수 | 분기 레일 정체 6개 이상인 분류구 |
| 집게차 대기 분류구 수 | 파레트 만재 후 미배정 |
| 재순환 · 리젝트 건수 | 누적 |
| 간선 출발 대수 / 적재율 | 출발 시점 적재율 |

| 알람 | 조건 | 등급 |
|---|---|---|
| 분류구 적체 | 정체 6개 이상 | crit |
| 분기 레일 만재 · 재순환 | 진입 실패 | crit |
| 출발 마감 임박 | 출발 5분 전, 적재율 85% 미만 | warn |
| 저적재 출발 | 적재율 85% 미만으로 출발 | crit |
| NO READ | 판독 실패 | warn |
| 설비 통신 끊김 | `GATEWAY_OFFLINE` | crit |

---

## 3. 아키텍처

```
[plc-sim]                 [edge-collector]              [RabbitMQ]              [server]                     [client]
Milo OPC UA 서버   ─OPC UA 구독─>  Milo 클라이언트   ─MQTT─>  MQTT 플러그인   ─AMQP─>  Spring Boot  ─STOMP/WS─>  React + R3F
(센터별 시뮬레이터)              → MQTT 발행                  amq.topic                 ├ Redis (현재 상태)
                                                                                      └ MySQL (이력)
                      <────────────── 제어 명령 (hub/{center}/cmd/...) ──────────────
```

### 원칙

- **server는 PLC와 직접 통신하지 않는다.** 수집은 `edge-collector`가 전담하고, 통신이 끊겨도 server는 영향을 받지 않는다.
- **제어는 PLC가, 판단은 서버가.** 박스 분기 같은 밀리초 단위 동작은 `plc-sim` 안에서 처리하고, 서버는 유입 속도·집게차 대수 같은 상위 지시만 내린다.
- **제어 명령(쓰기)은 인증 + 이력 기록**을 거친다.
- 브로커는 RabbitMQ 하나로 MQTT(장비 쪽)와 AMQP(서버 쪽)를 겸한다.

---

## 4. 레포 구조 (모노레포, Gradle 멀티모듈)

```
logistics-hub-twin/
├── plc-sim/          # 가상 PLC — Milo OPC UA 서버 + 허브 시뮬레이터
├── edge-collector/   # Milo OPC UA 클라이언트 → MQTT 발행
├── server/           # Spring Boot 4.1.2 — 수집 소비, 상태, 이력, WebSocket, LLM 분석
├── client/           # React + React Three Fiber
├── docker/           # docker-compose (RabbitMQ + MQTT, Redis, MySQL)
└── docs/             # 이벤트 정의, 토픽 설계, 화면 캡처
```

### 기술 스택

| 영역 | 기술 |
|---|---|
| 언어 · 런타임 | Java 21 |
| 서버 | Spring Boot 4.1.2, Spring AMQP, Spring WebSocket(STOMP), Spring Data JPA, Spring Data Redis, Spring Security(JWT) |
| 설비 통신 | Eclipse Milo 1.1.x (`milo-sdk-server`, `milo-sdk-client`), Eclipse Paho (MQTT 클라이언트) |
| 메시징 | RabbitMQ + `rabbitmq_mqtt` 플러그인 |
| 저장소 | Redis, MySQL |
| 프론트 | React, React Three Fiber, drei |
| LLM | Spring AI (Bedrock) |
| 인프라 | Docker Compose (로컬), AWS (배포) |

---

## 5. 모듈별 설계

설계 원칙: 기술 타입(Milo, Paho, Spring AI, JPA 엔티티 등)은 각자의 패키지 밖으로 나오지 않는다. 확장점은 인터페이스 하나 + 빈 하나.

### 5.1 plc-sim (가상 PLC)

- 프로토타입의 시뮬레이션 로직(레일, 분기 레일 큐잉, 집게차, 래핑, 트럭)을 자바로 옮긴다.
- 센터별로 인스턴스를 띄운다 (`CENTER_ID` 환경변수).
- OPC UA 태그 예시

```
Hub/{centerId}/Scanner/ReadCount
Hub/{centerId}/Scanner/NoReadCount
Hub/{centerId}/Lane/{A..F}/PalletCount
Hub/{centerId}/Lane/{A..F}/Status
Hub/{centerId}/Lane/{A..F}/BranchQueue
Hub/{centerId}/Dock/{D1..D6}/LoadRate
Hub/{centerId}/Dock/{D1..D6}/DepartAt
Hub/{centerId}/Control/InflowLevel      (쓰기)
Hub/{centerId}/Control/ForkliftCount    (쓰기)
```

- 검증: UaExpert로 접속해 태그 트리와 값 변화를 확인한다.

### 5.2 edge-collector (엣지 수집기)

```
com.marinbom2.logisticshubtwin.collector
├── source/
│   ├── FieldDataSource.java        # 인터페이스: 태그 구독, 값 변화 콜백
│   └── opcua/                      # Milo 구현체 (Milo 타입은 여기만)
├── publish/
│   ├── TelemetryPublisher.java     # 인터페이스: 상태 · 이벤트 발행
│   └── mqtt/                       # Paho 구현체 (Last Will, Retained 설정)
└── mapping/                        # 태그 값 → 도메인 메시지 변환
```

- 나중에 Modbus 설비를 붙이면 `source/modbus`(PLC4X) 구현체와 조건부 빈만 추가한다.

### 5.3 server

```
com.marinbom2.logisticshubtwin
├── center/        # 센터 · 분류구 · 도크 도메인
├── event/         # 도메인 이벤트, 멱등 처리
├── kpi/           # KPI 집계, 알람 판정
├── ingest/
│   └── rabbit/    # @RabbitListener — AMQP 타입은 여기만
├── state/
│   └── redis/     # 현재 상태 저장소 구현체
├── history/
│   └── jpa/       # 이력 저장소 구현체
├── realtime/
│   └── stomp/     # WebSocket 푸시
├── control/       # 제어 명령 API, 감사 로그
├── analysis/      # LLM 분석 유스케이스 (LlmClient 인터페이스)
└── llm/
    └── springai/  # Spring AI 구현체 — Spring AI 타입은 여기만
```

인터페이스 규약 (구현체를 바꿔도 동일)

| 인터페이스 | 규약 |
|---|---|
| `CenterStateStore` | 없는 센터 · 분류구 조회는 예외가 아니라 `Optional.empty()` |
| `EventHistoryRepository` | 같은 `eventId` 저장은 무시 (멱등) |
| `LlmClient` | 응답 실패 시 예외가 아니라 실패 결과 객체 반환 |

LLM 확장: `LlmProvider` 값 + `LlmClient` 구현체 + 조건부 빈.

---

## 6. 메시징 설계

### 6.1 MQTT 토픽

| 토픽 | QoS | Retained | 내용 |
|---|---|---|---|
| `hub/{center}/lane/{code}/state` | 1 | O | 적재 수, 상태, 분기 레일 대기 수 |
| `hub/{center}/dock/{dock}/truck` | 1 | O | 적재율, 출발 예정 시각, 상태 |
| `hub/{center}/scanner/{id}/read` | 0 | X | 스캔 결과 (고빈도) |
| `hub/{center}/event/{type}` | 1 | X | 도메인 이벤트 |
| `hub/{center}/gateway/status` | 1 | O | ONLINE / OFFLINE (Last Will) |
| `hub/{center}/cmd/{name}` | 1 | X | 제어 명령 (server → plc-sim) |

토픽 설계는 Sparkplug B 규격을 참고한다.

### 6.2 RabbitMQ 바인딩

MQTT 메시지는 `amq.topic` exchange로 들어오고 `/`는 `.`으로 바뀐다.

| 큐 | 라우팅 키 |
|---|---|
| `hub.lane-state` | `hub.*.lane.*.state` |
| `hub.dock-truck` | `hub.*.dock.*.truck` |
| `hub.events` | `hub.*.event.#` |
| `hub.gateway` | `hub.*.gateway.status` |

- QoS 1은 중복 전달이 가능하므로 `eventId` 기준으로 멱등 처리한다.
- 처리 실패 메시지는 DLQ로 보낸다.

---

## 7. 저장소 설계

### 7.1 Redis (현재 상태)

| 키 | 타입 | 내용 |
|---|---|---|
| `hub:{center}:lane:{code}` | Hash | palletCount, status, branchQueue, updatedAt |
| `hub:{center}:dock:{dock}` | Hash | loadRate, departAt, phase |
| `hub:{center}:kpi` | Hash | pph, readRate, jamCount, departed |
| `hub:{center}:sorted:{yyyyMMddHHmm}` | String (INCR) | 분 단위 분류 수, TTL 2시간 |
| `hub:{center}:gateway` | String | ONLINE / OFFLINE |
| `hub:evt:{eventId}` | String | 멱등 체크 (SET NX, TTL 1시간) |

### 7.2 MySQL (이력)

| 테이블 | 내용 |
|---|---|
| `center`, `lane`, `dock` | 마스터 |
| `hub_event` | 이벤트 이력 (`event_id` UNIQUE, `center_id` + `occurred_at` 인덱스) |
| `pallet` | 파레트 단위 실적 (적재 시작 · 만재 · 래핑 · 상차 시각) |
| `truck_trip` | 트럭 운행 (접안 · 출발 시각, 출발 적재율) |
| `alarm` | 알람 이력 (발생 · 해소 시각, 등급) |
| `control_audit` | 제어 명령 이력 (요청자, 명령, 이전 값, 새 값) |

---

## 8. API · 실시간 채널

### REST

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/centers` | 센터 목록 + 요약 KPI |
| GET | `/api/centers/{centerId}/snapshot` | 화면 첫 진입용 현재 상태 |
| GET | `/api/centers/{centerId}/alarms` | 알람 이력 |
| PUT | `/api/centers/{centerId}/control` | 유입량 · 집게차 대수 변경 (JWT 필요, 감사 기록) |
| POST | `/api/analysis/ask` | LLM 분석 질의 |

### WebSocket (STOMP)

| 토픽 | 내용 |
|---|---|
| `/topic/centers/summary` | 전체 센터 요약 (네트워크 카드용) |
| `/topic/centers/{centerId}/state` | 선택 센터 상태 (분류구, 도크, 집게차) |
| `/topic/centers/{centerId}/alarms` | 선택 센터 알람 |

프론트는 전체 요약 토픽 하나 + 선택한 센터 토픽만 구독한다.

---

## 9. 프론트엔드 화면

프로토타입 기준.

- **센터 네트워크**: 지역 필터, 센터 카드(시간당 처리량, 판독률, 적체, 출발 대수, 상태 칩)
- **선택 센터 KPI**: 시간당 분류량, 누적 처리, 판독률 · 리젝트 · 재순환, 적체 분류구, 출발 대수
- **3D 현장 (React Three Fiber)**
  - 메인 레일, 스캔 터널, 분기 레일 6개(긴 레일, 박스 줄서기), 분류구 파레트, 래핑 스테이션, 도크와 트럭, 집게차, 리젝트 케이지
  - 상태 링(집게차 대기 · 적체), 분류구 · 도크 라벨
  - 카메라 프리셋: 전체 / 레일 · 분류구 / 래핑 · 도크
  - 박스, 파레트 적재물은 InstancedMesh로 그린다
- **도크 패널**: 적재율 바, 출발 카운트다운, 마감 임박 표시
- **이벤트 · 알람 피드**
- **제어**: 유입량 슬라이더, 집게차 대수, 일시정지
- **분석 패널** (M6): 질문 입력 → 근거 수치와 함께 답변

---

## 10. LLM 분석 기능

질문 예시

- "어제 용인 3센터 B 분류구가 왜 자주 막혔어?"
- "이천 센터 저적재 출발이 많은 시간대는?"

처리 흐름

1. 질문에서 센터 · 기간 · 대상(분류구 · 도크)을 추출한다.
2. MySQL에서 근거 데이터를 집계한다: 적체 발생 시간대, 집게차 대기 시간, 유입량, 재순환 건수
3. 집계 결과만 프롬프트에 넣고 LLM이 요약한다. (원본 이벤트 전체를 넣지 않는다)
4. 답변에 사용한 수치를 함께 보여준다.

---

## 11. 개발 단계

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| M0 | 레포 · 인프라 | docker-compose로 RabbitMQ(MQTT 플러그인), Redis, MySQL 기동 |
| M1 | plc-sim | 1개 센터 시뮬레이터가 OPC UA 태그로 노출되고 UaExpert에서 값 변화 확인 |
| M2 | edge-collector | OPC UA 구독 → MQTT 발행, Last Will로 끊김 감지 |
| M3 | server 수집 · 상태 | RabbitMQ 소비 → Redis 상태 · MySQL 이력 저장, 멱등 처리 |
| M4 | 실시간 화면 | STOMP 푸시 → React에서 2D 관제로 먼저 연결 |
| M5 | 3D | 프로토타입을 React Three Fiber로 이식 |
| M6 | 다중 센터 | 센터 3곳 동시 기동, 네트워크 카드 · 센터 전환 |
| M7 | 제어 · 보안 | 제어 API, JWT, 감사 로그, cmd 토픽 → plc-sim 반영 |
| M8 | LLM 분석 | 분석 질의 API와 화면 |
| M9 | 배포 | AWS 배포, README · 아키텍처 문서 · 데모 영상 |

---

## 12. 보안 · 레포 관리

- `application.yml`은 값을 환경변수로만 참조한다 (`${JWT_SECRET}`, `${REDIS_HOST:localhost}`).
- `application-local.yml`, `.env`는 커밋하지 않고 `.env.example`만 커밋한다.
- 키를 한 번이라도 푸시했다면 즉시 폐기하고 재발급한다.
- `.gitignore`: Gradle 빌드 산출물, `node_modules`, `dist`, IDE 설정, `.env*`(예시 파일 제외), `docker/data/`
- GitHub Topics: `side-project`, `digital-twin`, `opc-ua`, `mqtt`, `spring-boot`, `react-three-fiber`, `logistics`

---

## 13. 참고

- Eclipse Milo: https://github.com/eclipse/milo
- RabbitMQ MQTT 플러그인: https://www.rabbitmq.com/docs/mqtt
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber
- UaExpert (Unified Automation): OPC UA 테스트 클라이언트
