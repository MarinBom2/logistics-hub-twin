import type { CenterConfig } from './types'

/**
 * 센터 설정. 센터를 늘리려면 여기에 한 줄씩 추가한다.
 * 센터 구성·처리량·목적지는 모두 시뮬레이션 값이다 (md/logistics-hub-twin.md 머리말).
 * 서버 수집(M3)이 붙으면 이 값은 GET /api/v1/centers 응답으로 바뀐다.
 */
export const CENTER_CONFIGS: CenterConfig[] = [
  {
    id: 'y3', name: '용인 3센터', code: 'HUB-Y3', region: '경기 남부', speed: 3, forks: 2,
    lanes: [['A', '수도권 남부', 0.24], ['B', '수도권 북부', 0.20], ['C', '충청권', 0.15], ['D', '호남권', 0.14], ['E', '영남권', 0.17], ['F', '강원권', 0.10]],
    seed: { processed: 18412, scanned: 18530, noRead: 118, departed: 7 },
  },
  {
    id: 'y5', name: '용인 5센터', code: 'HUB-Y5', region: '경기 남부', speed: 4, forks: 2,
    lanes: [['A', '서울 동부', 0.22], ['B', '서울 서부', 0.22], ['C', '경기 북부', 0.18], ['D', '인천', 0.16], ['E', '경기 남부', 0.14], ['F', '강원권', 0.08]],
    seed: { processed: 24907, scanned: 25060, noRead: 153, departed: 11 },
  },
  {
    id: 'ic', name: '이천 센터', code: 'HUB-IC', region: '경기 남부', speed: 3, forks: 1,
    lanes: [['A', '경남권', 0.22], ['B', '경북권', 0.18], ['C', '전남권', 0.16], ['D', '전북권', 0.14], ['E', '충청권', 0.20], ['F', '제주', 0.10]],
    seed: { processed: 15288, scanned: 15402, noRead: 114, departed: 5 },
  },
]
