# 할 일과 진행 방법

> 기준: [business-plan.md](./business-plan.md) §8(로드맵)·§12(12개월 할 일), [logistics-hub-twin.md](./logistics-hub-twin.md) §11(개발 단계 M0~M9), PR #1 의 "확인이 필요한 것". 2026-11-05 작성.
> 항목마다 "어떻게"에 접근 방법과 끝났다고 볼 기준을 적는다. 끝나면 `[x]`, 범위를 자르면 이유를 남긴다.
> 모르는 값은 `[ ]`로 비워 둔다. 숫자를 지어내지 않는다 (CLAUDE.md).

## 0. 순서

| 순서 | 할 일 | 관련 절 |
|---|---|---|
| 1 | PR #1 머지 뒤 확인 (Testcontainers, 실서버 화면 포워딩), CI 붙이기 | 1, 13 |
| 2 | 가격·약속 문구·계산기 기본값 확정 | 2 |
| 3 | 허브 인터뷰 10곳 시작, 설계 파트너 후보 3곳 | 3 |
| 4 | M0 인프라 → M1 plc-sim → M2 수집기 (실제 연결 데모) | 4, 5, 6 |
| 5 | M3 수집·상태·이력 → M4 실시간 화면 (워크스페이스에서 실데이터) | 7, 8 |
| 6 | 도입 문의 파기 배치, 공개 API 요청 제한 | 11 |
| 7 | M7 제어·감사 → M8 원인 분석 AI → M9 배포 | 9, 10, 13 |

파일럿 1호(2027 Q1, business-plan §8) 전까지 반드시 끝낼 것: 1·4·5·6. 밀리면 원인 분석 AI(M8)부터 미룬다. **수집기와 실데이터 화면은 자르지 않는다** (파일럿이 그것을 측정한다).

---

## 1. PR #1 머지 뒤 확인

- [ ] Docker 있는 환경에서 Testcontainers 테스트 실행
  - 어떻게: `./gradlew test`. `AuthFlowTest`(11), `ServerApplicationTests`(2), `BatchApplicationTests`(1)가 건너뛰지 않고 돌아야 한다
  - 끝 기준: 전부 통과. 지금은 H2 로 임시 확인만 했다 (MySQL 방언·`NoColumnCheckMySQLDialect`·유니크 제약은 MySQL 에서만 정확하다)
- [ ] 실서버로 띄워 화면 포워딩 확인
  - 어떻게: `docker compose up -d` → `./gradlew :server:bootRun -PwithClient` → 브라우저로 `http://localhost:9090/demo/centers/y3`, `/workspace`, `/login` 을 직접 열고 새로고침
  - 끝 기준: 세 경로 모두 화면이 뜨고, `/assets/없는파일.js` 는 index.html 이 아니라 404
- [ ] 실서버로 가입 → 센터 등록 → 팀원 발급 → 팀원 로그인 흐름을 화면에서 한 번
  - 끝 기준: mock 이 아니라 실제 API 로 같은 흐름이 된다. 쿠키가 `HttpOnly; SameSite=Lax` 로 붙는지 개발자 도구로 확인
- [ ] `client/README.md` 가 없다. 필요하면 Vite 기본 문구 대신 실행 방법만 짧게

## 2. 사업 결정 (business-plan §5·§6)

- [ ] 허브 요금제 월 290만 원 확정 또는 수정 (`pricing.hub-monthly-fee`, 랜딩 `content.ts` 의 `PLANS`)
  - 어떻게: 인터뷰(3절)에서 센터장 결재 한도를 듣고 정한다. 값을 바꾸면 mock(`mockSalesApi.ts` 의 `HUB_MONTHLY_FEE`)과 `RoiEstimatorTest` 의 `FEE` 도 같이
- [ ] 랜딩 약속 문구 확정: "숫자가 움직이지 않으면 계약하지 않으셔도 됩니다", "사용자 수 제한 없음", "이벤트 이력 보관"(기간 `[ ]`)
- [ ] 효과 계산기 기본값(가정) 검토. 특히 개선 비율 30%
  - 끝 기준: 파일럿 첫 3곳 실측의 중앙값으로 `RoiCalculator.tsx` 의 `DEFAULTS` 를 바꾸고 business-plan §4 표의 "근거"를 "실측"으로
- [ ] 설계 파트너 첫해 할인 폭 `[ ]`
- [ ] 클라우드 SaaS 와 온프레미스 설치형을 함께 팔지 (business-plan §13)

## 3. 고객 검증 (business-plan §2·§11)

- [ ] 허브 인터뷰 10곳
  - 질문: 지난달 저적재 출발이 몇 번이었나 / 적체를 어떻게 아는가 / 분류기·PLC 통신 방식(OPC UA·Modbus·MQTT·기타) / 월 예산 한도 / 설비 유지보수 계약에 넣어 사는지
  - 끝 기준: 인터뷰 노트 10건, business-plan §2·§6 의 `[ ]` 채우기
- [ ] 시장 규모 확인: 국내 택배·3PL 간선 허브 수 `[ ]`
  - 어떻게: 국토교통부 물류 통계, 택배사 사업보고서·IR. 출처 링크를 business-plan §2 에 남긴다
- [ ] 설계 파트너 3곳 확정, 파일럿 성공 기준 합의서 양식 (business-plan §5 "1주차에 고객과 정한다")
- [ ] 사업자·계약서·SLA 초안

## 4. M0 인프라

- [ ] `docker-compose.yml` 에 RabbitMQ(`rabbitmq_mqtt` 플러그인, 5672·1883·15672), Redis(6379) 추가
  - 끝 기준: `docker compose up -d` 로 셋이 뜨고 관리 화면 15672 접속
- [ ] `.env.example` 커밋 (실제 `.env` 는 gitignore)

## 5. M1 plc-sim (가상 PLC)

- [ ] 새 모듈 `plc-sim` (settings.gradle, server·core 와 코드 공유 없음)
- [ ] `client/src/features/twin/sim/Center.ts` 의 공정 로직을 자바로 옮긴다 (레일, 분기 레일 큐잉, 집게차, 래핑, 트럭)
  - 어떻게: 같은 입력(시드 고정)으로 TS·자바 결과가 같은지 비교하는 테스트
- [ ] Milo OPC UA 서버로 태그 노출 (logistics-hub-twin.md §5.1 태그 목록), 센터별 인스턴스(`CENTER_ID`)
  - 끝 기준: UaExpert 로 태그 트리와 값 변화 확인

## 6. M2 edge-collector (설비 수집기)

- [ ] 새 모듈 `edge-collector`. `FieldDataSource`(인터페이스) + `source/opcua` 구현체, `TelemetryPublisher` + `publish/mqtt` 구현체
  - 규약을 인터페이스 Javadoc 에 먼저 적고 추상 규약 테스트를 둔다 (solid.md L)
- [ ] MQTT Last Will 로 끊김 감지 (`hub/{center}/gateway/status`)
- [ ] 토픽에 고객사를 넣을지 결정: `hub/{organization}/{center}/...` 또는 수집기 인증(RabbitMQ 사용자·vhost)으로 구분 `[ ]`
  - 어떻게: authentication-security §9 의 고객사 분리 원칙에 맞춘다. 결정은 logistics-hub-twin.md §6 에 남긴다

## 7. M3 수집 · 상태 · 이력 (server)

- [ ] `ingest/rabbit`: `@RabbitListener`, AMQP 타입은 이 패키지 밖으로 내보내지 않는다
- [ ] `CenterStateStore`(Redis) / `EventHistoryRepository`(MySQL) 포트와 구현체
  - 규약: 없는 센터는 `Optional.empty()`, 같은 `eventId` 는 무시 (logistics-hub-twin.md §5.3)
  - 키·칼럼에 고객사 ID 를 넣는다 (`hub:{organizationId}:{centerCode}:…`, `hub_event.organization_id`)
- [ ] 수신 메시지의 센터 코드를 등록된 `Center` 와 맞춰 본다. 없는 센터 메시지는 버리고 로그
- [ ] 처리 실패는 DLQ
  - 끝 기준: plc-sim → 수집기 → server 로 Redis 상태와 MySQL 이력이 쌓이고, 같은 메시지를 두 번 보내도 이력은 한 건

## 8. M4 실시간 화면

- [ ] `realtime/stomp`: `/topic/centers/summary`, `/topic/centers/{centerId}/state` (고객사 단위로 구독 제한)
  - 시큐리티: 핸드셰이크 경로(`/ws/**`)를 인증 체인에 넣을지 결정, Vite 프록시에 `/ws` 추가 (runtime-structure.md §5)
- [ ] 워크스페이스에 실데이터 관제 화면 (`/workspace/centers/:centerId` 같은 새 SCR)
  - 어떻게: 데모의 패널·3D 를 그대로 쓰고 데이터만 바꾼다. `useHubNetwork` 와 같은 반환 형태(`CenterSummary`, `CenterDetail`)를 STOMP 로 채우는 훅을 하나 더 만든다 (solid.md 프론트 L·D)
- [ ] 센터 카드의 "수집 상태"를 연결 전 / 연결됨 / 끊김으로 (`GATEWAY_OFFLINE`)
- [ ] 경고 후 조치까지 걸린 시간을 이벤트로 남긴다 (business-plan §11 "현장이 실제로 움직이는가" 검증용)

## 9. M7 제어 · 감사

- [ ] `PUT /api/v1/centers/{centerId}/control` (OPERATOR 이상, 인가 규칙은 이미 있음)
- [ ] `control_audit` 테이블: 요청자, 명령, 이전 값, 새 값, 시각. 컨트롤러 밖에서 로그인 회원이 필요하면 계약봄의 `AccessUserInfo` 를 그때 가져온다
- [ ] `hub/{center}/cmd/...` 토픽 → plc-sim 반영
- [ ] 데모 화면의 제어(유입량·집게차·일시정지)는 시뮬레이션 전용으로 둔다. 실데이터 화면의 제어는 운영자 권한일 때만 보인다

## 10. M8 원인 분석 AI

- [ ] `LlmClient` 포트 + `llm/springai` 구현체, `LlmProvider` 값 + 조건부 빈 (solid.md O)
  - 규약: 실패는 예외가 아니라 실패 결과 객체
- [ ] 질문 → 센터·기간·대상 추출 → MySQL 집계 → 집계 결과만 프롬프트에 → 답변과 근거 수치 (logistics-hub-twin.md §10)
- [ ] 고객 데이터 반출 정책: LLM 공급자·리전을 고객에게 고지할 문구 `[ ]`

## 11. 영업 · 개인정보

- [ ] 도입 문의 파기 배치 (batch 모듈) — 랜딩 동의 문구 "응대가 끝나면 파기"를 지키기 위해
  - 어떻게: `Lead` 에 응대 완료 시각을 두고, 완료 뒤 보관 기간 `[ ]` 이 지난 행을 지운다. 기간은 개인정보 처리방침과 함께 정한다
- [ ] 개인정보 처리방침 페이지 (랜딩 푸터 링크)
- [ ] 문의가 들어오면 담당자에게 알림 (메일 또는 Slack). 지금은 DB 에만 쌓인다
- [ ] 문의 목록을 볼 운영사 화면. 고객사 권한(VIEWER·OPERATOR·ADMIN)과 별개인 운영사 권한이 필요하다 `[ ]`
- [ ] 공개 API(`/api/v1/roi/estimates`, `/api/v1/leads`) 요청 속도 제한
  - 어떻게: IP 기준 분당 제한. Redis(M0) 가 생기면 그 위에

## 12. 인증 · 계정 (authentication-security §13)

- [ ] 관리자가 팀원 권한을 바꾸거나 잠그는 API (`/api/v1/organization/members/{id}`)
- [ ] 팀원 첫 로그인 때 초기 비밀번호 바꾸게 하기
- [ ] 비밀번호 변경·재설정
- [ ] 로그인 실패 횟수 제한
- [ ] 토큰 갱신(refresh). 지금은 12시간 토큰 하나

## 13. 빌드 · 배포 (M9)

- [ ] GitHub Actions CI: PR 마다 `./gradlew build` (Testcontainers 포함, Docker 있는 러너)
  - 끝 기준: PR 에 체크가 뜨고, 빨간 PR 은 머지하지 않는다
- [ ] Dockerfile (server.jar 하나), 운영 환경변수 목록은 `application-prod.yml` 머리 주석
- [ ] AWS 배포 구성 `[ ]` (계약봄 `aws-infra-deploy.md` 를 참고해 이 프로젝트 문서로)
- [ ] 화면 다듬기
  - 3D 묶음(TwinScene) 약 1MB. 첫 화면 밖이라 지금은 둔다. 필요하면 drei 를 덜 쓰는 쪽으로
  - 한글 글꼴 CSS 가 큼 (`@fontsource/ibm-plex-sans-kr` 유니코드 구간 선언). 첫 화면 속도를 재 보고 판단 `[ ]`
  - three 경고 `THREE.Clock` 사용 중단 예고: R3F 업데이트 때 함께 확인

## 14. 문서

- [ ] 각 단계를 끝낼 때 logistics-hub-twin.md §11 표와 이 문서를 같이 고친다
- [ ] 요구사항 표(FR)·화면 목록(SCR)을 코드에서 뽑아 정리 (develop-principal.md §3)
