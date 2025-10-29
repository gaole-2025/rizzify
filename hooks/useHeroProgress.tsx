import { useEffect, useRef, useState } from 'react'

function useHeroProgress({ tau = 0.3 } = {}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const crosshairRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const trustPointsRef = useRef<HTMLDivElement>(null)
  const [dynamicHeight, setDynamicHeight] = useState(100)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let target = window.scrollY
    let current = target

    const maxScroll = window.innerHeight * 1.8 // 完整动画需要滚动的距离
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const apply = (p: number) => {
      if (!frameRef.current || !titleRef.current) return

      // 当执行锚点跳转时，让 Hero 立即处于结束状态
      const html = document.documentElement
      const jumping = html.classList.contains('anchor-jumping')
      const pEff = jumping ? 1 : p

      // 容器高度动态变化（保持布局流程）
      const containerHeight = lerp(100, 30, pEff) // 从100vh到30vh
      setDynamicHeight(containerHeight)

      // 等距裁切（上下对称）
      const insetVH = lerp(0, 18, pEff)      // 中段裁切强度
      const insetEnd = lerp(18, 46, pEff)    // 末段继续夹窄
      const clip = pEff < 0.6 ? insetVH : insetEnd

      const scale = lerp(1, 0.92, pEff)      // 轻微缩放

      // 文字淡化（连续，30%时完全消失）
      const titleO = lerp(1, 0, Math.min(pEff / 0.3, 1))

      // 使用 mask 替代 clip-path，创建渐变边缘
      const fadePercent = 10 // 5% 渐变区域
      const topStart = clip
      const topEnd = clip + fadePercent
      const bottomStart = 100 - clip - fadePercent
      const bottomEnd = 100 - clip

      const maskValue = `linear-gradient(to bottom,
        transparent 0%,
        transparent ${topStart}vh,
        black ${topEnd}vh,
        black ${bottomStart}vh,
        transparent ${bottomEnd}vh,
        transparent 100%)`

      // 应用样式
      frameRef.current.style.webkitMask = maskValue
      frameRef.current.style.mask = maskValue
      frameRef.current.style.transform = `scale(${scale})`

      titleRef.current.style.opacity = String(titleO)
      if (bottomRef.current) bottomRef.current.style.opacity = String(titleO)
      if (crosshairRef.current) crosshairRef.current.style.opacity = String(titleO)
      if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = String(titleO)
      if (trustPointsRef.current) trustPointsRef.current.style.opacity = String(titleO)
    }

    const onScroll = () => {
      target = window.scrollY
      if (!raf) tick(performance.now())
    }

    const tick = (now: number) => {
      const dt = Math.max(0, now - last) / 1000
      last = now
      const alpha = 1 - Math.exp(-dt / tau)     // 指数平滑
      current += (target - current) * alpha

      const p = clamp01(current / maxScroll)    // 0→1 进度
      apply(p)

      

      if (Math.abs(target - current) > 0.5) {
        raf = requestAnimationFrame(tick)
      } else {
        apply(clamp01(target / maxScroll))
        raf = 0
      }
    }

    // 检测移动端，降级处理
    const isMobile = window.matchMedia('(pointer: coarse)').matches
    if (isMobile) {
      // 移动端直接同步，避免触控滚动被放慢
      const onScrollMobile = () => {
        const p = clamp01(window.scrollY / maxScroll)
        apply(p)
      }
      window.addEventListener('scroll', onScrollMobile, { passive: true })
      return () => window.removeEventListener('scroll', onScrollMobile)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [tau])

  return { frameRef, titleRef, bottomRef, crosshairRef, scrollIndicatorRef, trustPointsRef, dynamicHeight }
}

export default useHeroProgress