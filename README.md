# Hub Twin

**트럭이 빈 칸을 싣고 떠나기 전에.** 택배·3PL 허브를 위한 상하차 관제 디지털 트윈.

레일 유입 → 스캔 → 분기 레일 → 파레트 → 집게차 → 래핑 → 도크 상차 → 간선 출발까지, 허브 공정을 한 장면으로 실시간 관제합니다. 지금 쓰는 설비와 WCS 는 그대로 두고 읽기 전용으로 붙여, 저적재 출발과 적체를 줄이고 간선 운송비와 대기 인건비를 아낍니다.

| 지금 되는 것 | 다음 |
|---|---|
| 3D 트윈·센터 네트워크·KPI·출발 마감·적체 경고 (시뮬레이션 데모) | 설비 수집기 (OPC UA·Modbus·MQTT) |
| 고객사 워크스페이스, 센터 등록, 팀원 계정·권한 (조회·운영자·관리자) | 실데이터 상태·이력, 실시간 화면 |
| 투자 대비 효과 계산기, 도입 문의 | 제어·감사 기록, 원인 분석 AI |

> 데모 화면의 센터 구성·처리량·목적지는 시뮬레이션 값이며 특정 기업과 무관합니다.

- 사업 기획서: [md/business-plan.md](md/business-plan.md)
- 제품·기술 기획서: [md/logistics-hub-twin.md](md/logistics-hub-twin.md)
- 개발 규약: [md/develop-principal.md](md/develop-principal.md)

## 구조

```
logistics-hub-twin/
├── common/core/   도메인·공통 설정 (Spring Boot 4.1.2, Java 21)
├── server/        API + 보안(JWT HttpOnly 쿠키) + 화면 서빙
├── batch/         배치
├── client/        Vite + React 19 + TypeScript + React Three Fiber
└── md/            문서
```

## 로컬 실행

```bash
docker compose up -d                      # MySQL
./gradlew :server:bootRun                 # http://localhost:9090 (Swagger: /swagger-ui.html)
cd client && npm install && npm run dev   # http://localhost:9091
```

서버 없이 화면만 볼 때는 `npm run dev:mock` (관리자 `admin@example.com` / `Passw0rd!`). 자세한 내용은 [md/runtime-structure.md](md/runtime-structure.md).

비밀 값(JWT 서명 키 등)은 저장소에 넣지 않는다. 로컬은 루트 `secrets/application-secret.yml`, 운영은 환경변수 (`JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
