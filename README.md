# logistics-hub-twin

**물류 허브 상하차 관제 디지털 트윈.** 레일 유입 → 스캔 → 분기 레일 → 파레트 → 집게차 → 래핑 → 도크 상차 → 간선 출발까지, 허브 공정을 3D 로 관제한다.

> 허브 상하차 1일 아르바이트 체험을 바탕으로 한 개인 학습용 프로젝트이며, 특정 기업과 무관합니다. 센터 구성·처리량·목적지는 모두 시뮬레이션 값입니다.

- 기획서: [md/logistics-hub-twin.md](md/logistics-hub-twin.md)
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

서버 없이 화면만 볼 때는 `npm run dev:mock`. 자세한 내용은 [md/runtime-structure.md](md/runtime-structure.md).

비밀 값(JWT 서명 키 등)은 저장소에 넣지 않는다. 로컬은 루트 `secrets/application-secret.yml`, 운영은 환경변수 (`JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
