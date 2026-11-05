@md/HARNESS.md

# logistics-hub-twin (제품명 Hub Twin)

택배·3PL 허브에 판매하는 B2B 상하차 관제 디지털 트윈. 문서를 먼저 읽고, 결정이 바뀌면 문서부터 고친다.

| 문서 | 내용 |
|---|---|
| [md/business-plan.md](md/business-plan.md) | 사업 기획서: 고객(택배·3PL 허브), 효과 계산, 8주 파일럿, 가격, 로드맵 |
| [md/logistics-hub-twin.md](md/logistics-hub-twin.md) | 제품·기술 기획서: 도메인, 아키텍처, 메시징·저장소 설계, 개발 단계(M0~M9) |
| [md/develop-principal.md](md/develop-principal.md) | 개발 규약: 모듈 구조, enum, 예외, API 응답·경로, 비밀 값 |
| [md/solid.md](md/solid.md) | SOLID 적용 기준 |
| [md/authentication-security.md](md/authentication-security.md) | 로그인·JWT 쿠키·권한 |
| [md/runtime-structure.md](md/runtime-structure.md) | 실행·빌드 (9090 서버, 9091 Vite, jar 하나에 화면 포함) |
| [md/todo.md](md/todo.md) | 할 일과 진행 방법: 순서, 항목별 접근 방법과 끝 기준 |

## Claude 가 지킬 것

- 한국어로 답한다. 커밋 메시지도 한국어 (`타입: 한글 요약`)
- 설계는 md/solid.md 를 따른다: 불변식은 한 클래스에, 확장점은 인터페이스 하나 + 빈 하나, 규약은 인터페이스에 못박기, 호출되는 메서드만, 기술 타입은 어댑터 패키지 밖으로 내보내지 않기
- 새 API 는 `/api/v1/` 아래, `@Tag`·`@Operation`(FR ID) 을 붙인다
- 코드에 요구사항 ID(`FR-…`)와 화면 ID(`SCR-…`)를 남긴다
- 데모의 센터 구성·처리량은 시뮬레이션 값이다. 실제 기업 데이터처럼 쓰지 않는다
- 숫자를 지어내지 않는다. 시장 규모·성과는 `[ ]` 로 비우고 확인 방법을 적는다. 고객 로고·후기·성과 수치를 화면에 만들어 넣지 않는다
- 고객사 데이터는 늘 로그인한 회원의 고객사 ID 로 거른다. 경로로 고객사 ID 를 받지 않는다
- 키, `.env`, `secrets/` 는 커밋하지 않는다
