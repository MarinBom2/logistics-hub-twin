import * as THREE from 'three'
import { BELT_END, BELT_START, BRANCH_LENGTH, LANE_COUNT } from '../sim/layout'

/*
 * 3D 화면이 같이 쓰는 재질·도형·텍스처. 화면은 하나뿐이라 모듈에 한 벌만 만든다.
 * 매 프레임 바뀌는 값(텍스처 offset, 스캔 빛 투명도)도 여기 객체를 직접 고친다.
 */

function mat(color: number, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.08, ...options })
}

export const M = {
  floor: mat(0x1a212b, { roughness: 0.95 }),
  steel: mat(0x6b7785, { metalness: 0.5, roughness: 0.45 }),
  dark: mat(0x2a323d),
  darker: mat(0x161c24),
  yellow: mat(0xf2b230, { roughness: 0.55 }),
  wood: mat(0xa47447),
  white: mat(0xd8dde3, { metalness: 0.25, roughness: 0.5 }),
  card: mat(0xc8965a, { roughness: 0.9 }),
  cab: mat(0x355b8a, { metalness: 0.3, roughness: 0.45 }),
  glass: mat(0x0b1118, { metalness: 0.6, roughness: 0.15 }),
  rubber: mat(0x111418, { roughness: 0.9 }),
  rejectBox: mat(0xb9564a),
  filmRoll: mat(0xe8f1ff, { roughness: 0.3 }),
  mark: new THREE.MeshBasicMaterial({ color: 0xf2b230 }),
  markDim: new THREE.MeshBasicMaterial({ color: 0x2b3542 }),
  beam: new THREE.MeshBasicMaterial({ color: 0x5aa9ff, transparent: true, opacity: 0.12, depthWrite: false }),
  film: new THREE.MeshStandardMaterial({
    color: 0xe8f1ff, transparent: true, opacity: 0.32, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false,
  }),
  hidden: new THREE.MeshBasicMaterial({ visible: false }),
  truckRoof: new THREE.MeshStandardMaterial({ color: 0xd8dde3, transparent: true, opacity: 0.16, depthWrite: false }),
}

export const G = {
  palletBox: new THREE.BoxGeometry(0.36, 0.3, 0.36),
  parcel: new THREE.BoxGeometry(0.5, 0.38, 0.46),
  rejectBox: new THREE.BoxGeometry(0.42, 0.34, 0.42),
  film: (() => {
    const geometry = new THREE.CylinderGeometry(0.9, 0.9, 1.0, 28, 1, true)
    geometry.translate(0, 0.5, 0)
    return geometry
  })(),
  truckWheel: (() => {
    const geometry = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 18)
    geometry.rotateZ(Math.PI / 2)
    return geometry
  })(),
  forkWheel: (() => {
    const geometry = new THREE.CylinderGeometry(0.26, 0.26, 0.2, 16)
    geometry.rotateZ(Math.PI / 2)
    return geometry
  })(),
}

function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

export const BELT_LENGTH = BELT_END - BELT_START

/** 벨트 표면 줄무늬. offset 을 흘려 움직이는 것처럼 보인다 */
export const beltTexture = canvasTexture(64, 64, (g) => {
  g.fillStyle = '#20272f'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = '#2c3540'
  g.fillRect(0, 0, 10, 64)
})
beltTexture.repeat.set(BELT_LENGTH * 1.5, 1)

/** 분기 레일 벨트. 레일마다 offset 이 따로라 복제한다 */
export const branchTextures = Array.from({ length: LANE_COUNT }, () => {
  const texture = beltTexture.clone()
  texture.needsUpdate = true
  texture.center.set(0.5, 0.5)
  texture.rotation = Math.PI / 2
  texture.repeat.set(BRANCH_LENGTH * 1.5, 1)
  return texture
})

/** 도크 범퍼의 노랑·검정 사선 */
export const stripeTexture = canvasTexture(64, 16, (g) => {
  g.fillStyle = '#f2b230'
  g.fillRect(0, 0, 64, 16)
  g.fillStyle = '#1a1d22'
  for (let x = -16; x < 64; x += 16) {
    g.beginPath()
    g.moveTo(x, 16)
    g.lineTo(x + 8, 16)
    g.lineTo(x + 16, 0)
    g.lineTo(x + 8, 0)
    g.closePath()
    g.fill()
  }
})
stripeTexture.repeat.set(3, 1)

export const beltMaterial = new THREE.MeshStandardMaterial({ map: beltTexture, roughness: 0.9 })
export const branchMaterials = branchTextures.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.9 }))
export const stripeMaterial = new THREE.MeshStandardMaterial({ map: stripeTexture, roughness: 0.7 })
