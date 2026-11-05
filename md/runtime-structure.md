# 실행·빌드 구조 — 한 오리진 원칙

> 목적: 화면(React)과 API(Spring)를 **어떻게 띄우고, 어떻게 묶고, 어떻게 배포하는지**를 한곳에 정리한다. 로컬 개발은 편하게(HMR), 운영은 단순하게(jar 하나), 그리고 둘의 동작 조건은 같게 만드는 것이 목표다.
> 바탕: 계약봄 runtime-structure.md 와 같은 구조 (포트 9090/9091, `-PskipClient`·`-PwithClient`).
> 관련 문서: [develop-principal.md](./develop-principal.md) §5, [authentication-security.md](./authentication-security.md) §6, [logistics-hub-twin.md](./logistics-hub-twin.md) §4

## 한눈에 보기

| 패턴 | 이 프로젝트에서 | 얻는 것 |
|---|---|---|
| **같은 오리진 서빙** | 브라우저는 화면과 API 를 늘 한 주소에서 받는다 | CORS 설정이 필요 없다. HttpOnly 인증 쿠키가 그대로 동작한다 |
| **단일 배포 단위** | 빌드된 화면(client/dist)이 server.jar 의 `static/` 안에 들어간다 | 배포물이 jar 하나. 화면과 API 버전이 어긋나지 않는다 |
| **개발 서버 프록시** | 로컬에서는 Vite(9091)가 화면을 주고, `/api`만 서버(9090)로 넘긴다 | HMR 로 즉시 확인하면서도 브라우저 입장에서는 운영과 같은 한 오리진 |

---

## 1. 세 가지 실행 방식

### A. 로컬 개발

```bash
docker compose up -d                 # MySQL (logistics_hub)
./gradlew :server:bootRun            # 터미널 1: 서버 9090 (npm 빌드가 돌지 않는다, local 프로필)
cd client && npm install && npm run dev   # 터미널 2: 화면 9091 (HMR)
```

Windows 는 `.\gradlew.bat :server:bootRun`. 브라우저는 `http://localhost:9091`.

### B. 서버 없이 화면만

```bash
cd client && npm run dev:mock        # 인증은 localStorage 가짜 API (operator@example.com / Passw0rd!)
```

관제 데이터는 지금 서버 연결과 무관하게 브라우저 안 시뮬레이션(`features/twin/sim`)이 만든다. 서버 실시간 채널(M4)이 붙으면 A 방식에서만 실제 데이터가 보인다.

### C. 로컬 통합 확인 / 운영

```bash
./gradlew :server:bootRun -PwithClient     # 9090 에서 jar 처럼 화면까지
./gradlew build                            # 테스트 + 화면이 든 server.jar
java -jar server/build/libs/server.jar --spring.profiles.active=prod
```

---

## 2. 포트

| 용도 | 로컬 | 운영 |
|---|---|---|
| Spring (API + 화면) | 9090 | `SERVER_PORT` (기본 9090) |
| Vite dev 서버 | 9091 | 없음 |
| MySQL | 3306 (docker-compose) | RDS |
| (예정) RabbitMQ AMQP / MQTT / 관리 화면 | 5672 / 1883 / 15672 | |
| (예정) Redis | 6379 | |
| (예정) plc-sim OPC UA | 4840 | |

---

## 3. Gradle 플래그

| 담는 곳 | 기본 | 바꾸는 플래그 | 이유 |
|---|---|---|---|
| jar (`:server:bootJar`) | **담는다** | `-PskipClient`로 뺀다 | 배포 jar 는 늘 화면을 가져야 한다 |
| 로컬 실행 (`bootRun`, IDE) | **안 담는다** | `-PwithClient`로 담는다 | 평소엔 Vite 가 화면을 맡는다. 서버를 띄울 때마다 npm 빌드가 돌지 않게 |

설정 위치: `server/build.gradle` 맨 아래, `client/build.gradle`(node-gradle 플러그인, Node 22.13 자동 설치).

---

## 4. 같은 오리진이라서 생기는 이점

- **CORS 가 필요 없다.** 그래서 Spring Security 에 CORS 설정을 두지 않는다.
- **인증 쿠키가 운영과 똑같이 동작한다.** 로컬은 http 라 local 프로필에서 `jwt.cookie.secure: false`로만 덮는다.
- **화면과 API 버전이 늘 같다.** 같은 jar 에서 나온다.

---

## 5. 프론트가 지킬 것

| 규칙 | 이유 |
|---|---|
| API 주소는 **상대 경로**(`/api/...`). `apiClient`의 기본 주소는 빈 값 | A 에서는 Vite 프록시를, C 에서는 Spring 을 그대로 탄다 |
| `.env.*`에 의존하지 않는다 | gitignore 라 CI 빌드에는 없다. 기본값이 운영에서 맞는 값이어야 한다 |
| 프록시 대상은 `/api`만 (WebSocket 이 생기면 `/ws` 추가) | 화면 경로와 API 경로가 접두사로 나뉘어야 프록시와 SPA 포워딩이 단순하다 |
| 3D 묶음(three·fiber·drei)은 `TwinScene`을 lazy 로 받는다 | 첫 화면 묶음과 분리 (`routeChunks.ts`) |

---

## 6. 주의할 점

| 상황 | 문제 | 대응 |
|---|---|---|
| Vite dev 서버를 띄운 채 `-PwithClient`나 `bootJar` | 윈도우에서 npmInstall 이 Vite 가 잡은 파일을 못 지워 EPERM | dev 서버를 끄고 돌린다 |
| 화면 경로를 새로고침 | `/centers/y3`를 서버가 모르면 404 | `SpaForwardController`가 화면 경로만 `index.html`로 돌린다. `/api/**`, `/assets/**`, 확장자 있는 경로는 넣지 않는다 |
| 배포 직후 열려 있던 화면 | 이전 해시의 JS 청크가 없어 화면 이동 실패 | `vite:preloadError`에서 새로고침 (`main.tsx`) |
| A 방식에서 서버가 꺼져 있음 | `/api` 요청이 Vite 에서 502 | 관제 화면은 그대로 동작하고 로그인 상태만 "로그인 전"으로 보인다 |
| WebGL 을 못 쓰는 브라우저 | 3D 가 안 뜸 | Canvas `fallback` + 오류 경계로 안내 문구를 띄우고 숫자 패널은 계속 갱신 |

---

## 체크리스트

- [ ] 새 API 가 `/api/v1/` 아래인가 (프록시·시큐리티·SPA 포워딩 기준)
- [ ] 새 화면 경로를 `routes.ts`와 `SpaForwardController`에 함께 넣었는가
- [ ] 클라이언트가 절대 주소를 쓰지 않는가
- [ ] `./gradlew build`가 화면이 든 jar 를 만드는가
