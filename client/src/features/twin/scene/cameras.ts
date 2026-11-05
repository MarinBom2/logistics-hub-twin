/** 카메라 시점 프리셋. 버튼을 누르면 0.9초 동안 옮겨 간다 */
export const CAMERA_PRESETS = {
  all: { label: '전체', position: [-6, 29, 31], target: [0, 0, 0.5] },
  rail: { label: '레일 · 분류구', position: [-17, 11, 0], target: [-1, 0.8, -7] },
  dock: { label: '래핑 · 도크', position: [13, 10, 22], target: [0, 0.6, 7.5] },
} as const satisfies Record<string, { label: string; position: [number, number, number]; target: [number, number, number] }>

export type CameraPreset = keyof typeof CAMERA_PRESETS
