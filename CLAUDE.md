@md/HARNESS.md

# logistics-hub-twin

물류 허브 상하차 관제 디지털 트윈. 문서를 먼저 읽고, 결정이 바뀌면 문서부터 고친다.

| 문서 | 내용 |
|---|---|
| [md/logistics-hub-twin.md](md/logistics-hub-twin.md) | 기획서: 도메인, 아키텍처, 메시징·저장소 설계, 개발 단계(M0~M9) |
| [md/develop-principal.md](md/develop-principal.md) | 개발 규약: 모듈 구조, enum, 예외, API 응답·경로, 비밀 값 |
| [md/solid.md](md/solid.md) | SOLID 적용 기준 |
| [md/authentication-security.md](md/authentication-security.md) | 로그인·JWT 쿠키·권한 |
| [md/runtime-structure.md](md/runtime-structure.md) | 실행·빌드 (9090 서버, 9091 Vite, jar 하나에 화면 포함) |

## Claude 가 지킬 것

- 한국어로 답한다. 커밋 메시지도 한국어 (`타입: 한글 요약`)
- 설계는 md/solid.md 를 따른다: 불변식은 한 클래스에, 확장점은 인터페이스 하나 + 빈 하나, 규약은 인터페이스에 못박기, 호출되는 메서드만, 기술 타입은 어댑터 패키지 밖으로 내보내지 않기
- 새 API 는 `/api/v1/` 아래, `@Tag`·`@Operation`(FR ID) 을 붙인다
- 코드에 요구사항 ID(`FR-…`)와 화면 ID(`SCR-…`)를 남긴다
- 화면과 데이터의 센터 구성·처리량은 시뮬레이션 값이다. 실제 기업 데이터처럼 쓰지 않는다
- 키, `.env`, `secrets/` 는 커밋하지 않는다
