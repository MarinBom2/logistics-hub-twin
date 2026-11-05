/*
 * 랜딩 문구. 고객사 로고·후기·성과 수치는 넣지 않는다 (아직 없다).
 * 제공 범위는 사실대로: 'live' 는 지금 데모에서 동작, 'beta' 는 워크스페이스에서 제공, 'soon' 은 파일럿에서 함께 만든다.
 */

export type Availability = 'live' | 'beta' | 'soon'

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  live: '데모에서 동작',
  beta: '워크스페이스 제공',
  soon: '파일럿에서 제공',
}

export const PROBLEMS = [
  {
    title: '트럭은 빈 칸을 싣고 떠납니다',
    body: '출발 마감에 쫓긴 간선 트럭은 적재율을 확인할 틈 없이 출발합니다. 5분 전에 알았다면 파레트 하나를 더 실을 수 있었습니다.',
  },
  {
    title: '적체는 무전으로 알게 됩니다',
    body: '분기 레일이 막히면 박스는 재순환을 돌고 현장 인원은 기다립니다. 누군가 무전을 칠 때쯤이면 이미 수백 개가 밀려 있습니다.',
  },
  {
    title: '화면은 설비 수만큼 쪼개져 있습니다',
    body: '분류기, WCS, 도크 관리가 각자 다른 화면입니다. 센터장은 다음 날 엑셀로 합쳐서야 어제 무슨 일이 있었는지 봅니다.',
  },
] as const

export const CAPABILITIES: { title: string; body: string; availability: Availability }[] = [
  { title: '3D 디지털 트윈', body: '레일 유입 → 스캔 → 분기 레일 → 파레트 → 집게차 → 래핑 → 도크 상차까지 공정 전체를 한 장면으로.', availability: 'live' },
  { title: '센터 네트워크 관제', body: '여러 허브를 지역별로 묶어 처리량·판독률·적체·출발 대수를 한 화면에서 비교.', availability: 'live' },
  { title: '출발 마감 경고', body: '출발 5분 전 적재율 85% 미만이면 도크와 관제실에 동시에 알립니다.', availability: 'live' },
  { title: '적체 감지', body: '분기 레일에 6개 이상 줄 서면 적체로 판정하고, 재순환·리젝트를 함께 셉니다.', availability: 'live' },
  { title: '고객사별 워크스페이스', body: '센터 등록, 팀원 계정 발급, 조회·운영자·관리자 권한. 고객사 데이터는 서로 보이지 않습니다.', availability: 'beta' },
  { title: '설비 연결 수집기', body: 'OPC UA·Modbus·MQTT 로 기존 PLC·WCS 에 읽기 전용으로 붙습니다. 수집기는 고객사 내부망에 둡니다.', availability: 'soon' },
  { title: '원인 분석 AI', body: '"어제 B 분류구가 왜 자주 막혔지?" — 이벤트 이력을 집계한 근거 수치와 함께 답합니다.', availability: 'soon' },
]

export const STEPS = [
  { no: '01', title: '연결', body: '설비와 WCS 는 그대로. 읽기 전용 수집기가 레일·분류구·도크 신호를 모읍니다.' },
  { no: '02', title: '트윈', body: '수집한 신호로 허브를 3D 로 재현하고 KPI 를 초 단위로 계산합니다.' },
  { no: '03', title: '판단', body: '출발 마감·적체를 먼저 알리고, 쌓인 이력으로 원인을 설명합니다.' },
] as const

export const PILOT = [
  { weeks: '1–2주', title: '연결', body: '수집기 설치, 센터·분류구·도크 매핑. 설비 설정은 바꾸지 않습니다.' },
  { weeks: '3–6주', title: '기준선 측정', body: '경고를 끈 상태로 지금의 저적재 출발 비율과 적체 시간을 잽니다.' },
  { weeks: '7–8주', title: '개선 측정', body: '경고를 켜고 같은 지표를 다시 잽니다. 차이가 곧 효과입니다.' },
] as const

export const PLANS = [
  {
    name: '파일럿',
    price: '₩0',
    unit: '8주 · 허브 1곳',
    points: ['설비 연결 지원', '기준선·개선 리포트', '워크스페이스·팀원 계정'],
    cta: '파일럿 신청',
    featured: false,
  },
  {
    name: '허브',
    price: '₩2,900,000',
    unit: '허브당 · 월 (부가세 별도)',
    points: ['실시간 트윈·KPI·경고', '사용자 수 제한 없음', '이벤트 이력 보관', '파일럿 리포트 기준 효과 점검'],
    cta: '도입 문의',
    featured: true,
  },
  {
    name: '네트워크',
    price: '협의',
    unit: '허브 5곳 이상',
    points: ['센터 간 비교', '원인 분석 AI', '전담 엔지니어'],
    cta: '상담 요청',
    featured: false,
  },
] as const

export const TRUST = [
  { title: '설비를 멈추지 않습니다', body: '읽기 전용으로 시작합니다. 제어 명령은 운영자 권한과 감사 기록을 거쳐야 나갑니다.' },
  { title: '고객사 데이터는 섞이지 않습니다', body: '모든 조회가 고객사 단위로 갈립니다. 다른 고객사의 센터는 존재 여부도 보이지 않습니다.' },
  { title: '로그인은 쿠키 하나로', body: 'HttpOnly·SameSite 쿠키로 토큰을 다룹니다. 화면 스크립트는 토큰을 읽을 수 없습니다.' },
] as const
