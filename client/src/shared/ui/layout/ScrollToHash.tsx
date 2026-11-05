import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** 다른 화면에서 /#pricing 같은 주소로 오면 그 구역으로, 그 밖의 화면 이동은 맨 위로 */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    // 랜딩이 그려진 다음 프레임에 찾는다
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
