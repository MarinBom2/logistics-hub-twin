/*
 * 현장 치수와 공정 상수. 모든 센터가 같은 배치를 쓴다 (md/logistics-hub-twin.md §2.1).
 * 시뮬레이션(Center)과 3D 화면이 같은 값을 써야 박스가 레일 위에 놓인다.
 */

/** 파레트 한 장 만재 박스 수 (3×3×3) */
export const PALLET_CAPACITY = 27
/** 트럭 한 대를 채우는 파레트 수 */
export const PALLETS_PER_TRUCK = 8
/** 분기 레일에 이만큼 줄 서면 적체로 본다 */
export const JAM_BACKLOG = 6
/** 출발 마감 경고: 출발 5분 전, 적재율 85% 미만 */
export const LATE_ETA_SEC = 300
export const LOW_LOAD_RATE = 0.85

export const LANE_COUNT = 6
export const laneX = (i: number) => -10 + i * 4

export const BELT_Z = -12
export const BELT_Y = 1.0
export const SCAN_X = -13
export const BELT_START = -17
export const BELT_END = 15.4
export const BELT_SPEED = 2.6

export const PALLET_Z = -1.2
export const WRAP_X = [-4, 4] as const
export const WRAP_Z = 3.4
export const DOCK_Z = 8.6

/** 분기 레일 속도와 박스 간격 */
export const BRANCH_SPEED = 1.5
export const BRANCH_GAP = 0.62
export const BRANCH_TOP_Y = BELT_Y + 0.02
export const BRANCH_TOP_Z = BELT_Z + 0.75
export const BRANCH_BOTTOM_Y = 0.62
export const BRANCH_BOTTOM_Z = PALLET_Z - 0.85
export const BRANCH_LENGTH = Math.hypot(BRANCH_BOTTOM_Z - BRANCH_TOP_Z, BRANCH_TOP_Y - BRANCH_BOTTOM_Y)
export const CHUTE_ANGLE = Math.atan2(BRANCH_TOP_Y - BRANCH_BOTTOM_Y, BRANCH_BOTTOM_Z - BRANCH_TOP_Z)

/** 동시에 레일 위에 있을 수 있는 박스 수 (메쉬 풀 크기) */
export const PARCEL_POOL = 70
export const REJECT_PILE_MAX = 8

/** 레일 유입량 단계 1~5 */
export const SPEED_LABEL = ['', '매우 낮음', '낮음', '보통', '높음', '피크'] as const
/** 유입량 1단계당 초당 박스 수 */
export const SPAWN_PER_LEVEL = 0.42
