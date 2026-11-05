import * as THREE from 'three'
import { BRANCH_BOTTOM_Y, BRANCH_BOTTOM_Z, BRANCH_TOP_Y, BRANCH_TOP_Z, laneX } from '../../sim/layout'

/** 분기 레일 i 의 위·아래 끝. 레일과 박스가 같은 선을 쓴다 */
export const branchTop = (i: number) => new THREE.Vector3(laneX(i), BRANCH_TOP_Y, BRANCH_TOP_Z)
export const branchBottom = (i: number) => new THREE.Vector3(laneX(i), BRANCH_BOTTOM_Y, BRANCH_BOTTOM_Z)
