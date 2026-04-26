import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'

const sectionTitles = [
  '体験',
  '選択',
  '結果',
  '気づき',
  'サイクル',
  '6つのE',
  'e6について',
]

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const remapProgress = (value: number, start: number, end: number) => clamp((value - start) / (end - start))

const mixColor = (a: [number, number, number], b: [number, number, number], amount: number) => {
  const t = clamp(amount)
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const b2 = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r} ${g} ${b2})`
}

const mixPoint = (
  a: [number, number],
  b: [number, number],
  amount: number,
) => `${a[0] + (b[0] - a[0]) * amount}% ${a[1] + (b[1] - a[1]) * amount}%`

function App() {
  const [stance, setStance] = useState(0.5)
  const [activeIndex, setActiveIndex] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [whiteTransition, setWhiteTransition] = useState(0)
  const [pulseDrift, setPulseDrift] = useState(0)
  const [hasChosenStance, setHasChosenStance] = useState(false)
  const [isDraggingStance, setIsDraggingStance] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])
  const stanceCommittedRef = useRef(false)

  const stancePct = Math.round(stance * 100)
  const pulseMorph = remapProgress(stance, 0.08, 0.92)
  const pulseDurationMs = 1800 + stance * 1400
  const pulseClipPath = useMemo(() => {
    const triangle: Array<[number, number]> = [
      [50, 2],
      [93, 84],
      [84, 92],
      [50, 98],
      [16, 92],
      [7, 84],
      [50, 2],
      [50, 2],
    ]
    const circle: Array<[number, number]> = [
      [50, 0],
      [84, 16],
      [100, 50],
      [84, 84],
      [50, 100],
      [16, 84],
      [0, 50],
      [16, 16],
    ]
    return `polygon(${triangle
      .map((point, index) => mixPoint(point, circle[index], pulseMorph))
      .join(', ')})`
  }, [pulseMorph])
  const pulseStyle = useMemo(
    () =>
      ({
        clipPath: pulseClipPath,
        '--pulse-duration': `${pulseDurationMs}ms`,
        '--pulse-scale-start': String(0.82 + stance * 0.08),
        '--pulse-scale-mid': String(0.92 + stance * 0.1),
        '--pulse-scale-peak': String(1.02 + stance * 0.12),
        '--pulse-rotate': `${-18 + stance * 18}deg`,
        '--pulse-shadow': `${26 + stance * 24}px`,
        '--pulse-radius': `${10 + stance * 40}%`,
      }) as CSSProperties,
    [pulseClipPath, pulseDurationMs, stance],
  )
  const pulseShellStyle = useMemo(
    () =>
      ({
        '--pulse-drift': `${pulseDrift}deg`,
        '--pulse-drift-duration': `${Math.round(pulseDurationMs * 3.1)}ms`,
      }) as CSSProperties,
    [pulseDrift, pulseDurationMs],
  )

  const dynamicStyle = useMemo(() => {
    const tone = mixColor([32, 120, 208], [255, 72, 128], stance)
    const soft = mixColor([16, 168, 255], [255, 72, 128], stance)
    const deep = mixColor([10, 19, 34], [38, 15, 40], stance)
    return {
      '--tone': tone,
      '--tone-soft': soft,
      '--tone-deep': deep,
      '--stance': String(stance),
      '--white-transition': String(remapProgress(whiteTransition, 0.2, 0.8)),
      '--white-transition-text': String(remapProgress(whiteTransition, 0.28, 0.88)),
    } as CSSProperties
  }, [stance, whiteTransition])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) {
      return
    }
    const sections = sectionRefs.current.filter((section): section is HTMLElement => !!section)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(index)) {
              setActiveIndex(index)
            }
          }
        })
      },
      { root, threshold: 0.65 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // プロト段階の挙動ロギング（将来は分析基盤に接続）
    console.info('[e6-prototype] stance', { value: stance.toFixed(2) })
  }, [stance])

  useEffect(() => {
    let timeoutId: number | null = null
    let current = pulseDrift

    const nextAngle = () => {
      const direction = Math.random() > 0.5 ? 1 : -1
      const angleStep = 80 + Math.random() * 70
      return current + direction * angleStep
    }

    const schedule = (interval: number) => {
      timeoutId = window.setTimeout(() => {
        const next = nextAngle()
        current = next
        setPulseDrift(next)
        schedule(pulseDurationMs * (3.05 + Math.random() * 0.45))
      }, interval)
    }

    const initial = nextAngle()
    current = initial
    setPulseDrift(initial)
    schedule(pulseDurationMs * (1.1 + Math.random() * 0.35))

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [pulseDurationMs])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) {
      return
    }

    const onScroll = () => {
      const pauseSection = sectionRefs.current[3]
      if (!pauseSection) {
        return
      }

      // 「気づき」が下端から入り始めて、ちょうど 100vh で全面表示されるまでを 0..1 に正規化する。
      const start = pauseSection.offsetTop - root.clientHeight
      const end = pauseSection.offsetTop
      const distance = Math.max(1, end - start)
      const next = clamp((root.scrollTop - start) / distance, 0, 1)
      setWhiteTransition(next)
    }

    onScroll()
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const handleDrag = (clientX: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / rect.width)
    setStance(ratio)
  }

  const commitStanceSelection = () => {
    if (stanceCommittedRef.current) {
      return
    }
    stanceCommittedRef.current = true
    setHasChosenStance(true)
    window.setTimeout(() => {
      scrollToSection(2)
    }, 140)
  }

  const resetStanceExperience = () => {
    stanceCommittedRef.current = false
    setHasChosenStance(false)
    setIsDraggingStance(false)
    scrollToSection(1)
  }

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMapOpen(false)
  }

  return (
    <div className="prototype" style={dynamicStyle}>
      <aside className={`minimap ${mapOpen ? 'open' : ''}`}>
        <button className="minimap-toggle" onClick={() => setMapOpen((prev) => !prev)}>
          {mapOpen ? '閉じる' : '目次'}
        </button>
        <ul>
          {sectionTitles.map((title, index) => (
            <li key={title}>
              <button
                className={activeIndex === index ? 'active' : ''}
                onClick={() => scrollToSection(index)}
              >
                <span className="dot" />
                <small>{title}</small>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="viewport" ref={viewportRef}>
        <section
          className="block intro"
          data-index={0}
          ref={(el) => {
            sectionRefs.current[0] = el
          }}
        >
          <header>
            <img src="/images/e6_logo_yoko_big.png" alt="e6 logo" />
            <ul className="header-nav">
              <li><a href="#">Introduction</a></li>
              <li><a href="#">Interaction</a></li>
              <li><a href="#">Feedback</a></li>
              <li><a href="#">About</a></li>
            </ul>
          </header>
          <div className="intro-words" aria-hidden="true">
            <p>Experience</p>
            <p>Choice</p>
            <p>Insight</p>
          </div>
          <div className="intro-content">
            <h1 className="intro-title">没入・判断・覚醒</h1>
            <p className="intro-copy">まずは、少しだけ体験してみてください</p>
            <div className="intro-actions">
              <button className="ghost" onClick={() => scrollToSection(1)}>
                触れてみる
              </button>
              <button className="skip-link" onClick={() => scrollToSection(4)}>
                SKIP
              </button>
            </div>
          </div>
        </section>

        <section
          className="block stance"
          data-index={1}
          ref={(el) => {
            sectionRefs.current[1] = el
          }}
        >
          <div className="stance-prompt">
            <p className="hint">深く考えず、直感で</p>
            <h2>あなたの AIとの関わり方は？</h2>
          </div>

          <div className="stance-controls">
            <div
              className="slider stance-surface"
              data-state={hasChosenStance ? 'chosen' : 'idle'}
              data-dragging={isDraggingStance ? 'true' : 'false'}
              role="slider"
              aria-label="関わり方のスタンス（入口の体験）"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stancePct}
              onPointerDown={(event) => {
                const target = event.currentTarget
                target.setPointerCapture(event.pointerId)
                setHasChosenStance(true)
                setIsDraggingStance(true)
                handleDrag(event.clientX, target)
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) {
                  handleDrag(event.clientX, event.currentTarget)
                }
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
                setIsDraggingStance(false)
                commitStanceSelection()
              }}
              onPointerCancel={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
                setIsDraggingStance(false)
              }}
            >
              <div className="stance-side left" aria-hidden="true">
                向き合う
              </div>
              <div className="stance-side right" aria-hidden="true">
                共に進む
              </div>
              <div className="slider-track">
                <div className="slider-thumb" style={{ left: `${stancePct}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section
          className="block feedback"
          data-index={2}
          ref={(el) => {
            sectionRefs.current[2] = el
          }}
        >
          <h2>選択は、見え方を変えます</h2>
          <div className="pulse-shell" style={pulseShellStyle}>
            <div className="pulse" style={pulseStyle} />
          </div>
          <p>
            選択によって、見えるものや感じ方が少し変わります。
          </p>
          <div className="feedback-actions">
            <button className="ghost feedback-next" onClick={() => scrollToSection(3)}>
              そして
            </button>
            <button className="skip-link feedback-reset" onClick={resetStanceExperience}>
              選び直す
            </button>
          </div>
        </section>

        <section
          className="block pause"
          data-index={3}
          ref={(el) => {
            sectionRefs.current[3] = el
          }}
        >
          <h2>最後に意味を与えるのは、<strong>あなた。</strong></h2>
          <div className="pause-card">
            <p className="pause-label">この体験が <strong>e6</strong>です。</p>
            <p className="pause-copy">あなたの選択が結果を変えることに気づきましたか？</p>
          </div>
        </section>

        <section
          className="block cycle explain-area explain-entry"
          data-index={4}
          ref={(el) => {
            sectionRefs.current[4] = el
          }}
        >
          <div className="cycle-bg" aria-hidden="true">
            <span>Experience</span>
            <span>Choice</span>
            <span>Insight</span>
          </div>
          <h2>3つの体験のサイクル</h2>
          <h3>没入 → 判断 → 覚醒</h3>
          <p className="cycle-sub">体験から生まれた選択が、次の気づきを呼び込む。</p>
        </section>

        <section
          className="block sixe explain-body"
          data-index={5}
          ref={(el) => {
            sectionRefs.current[5] = el
          }}
        >
          <h2>6つのE</h2>
          <p>6つのEが、没入・判断・覚醒のサイクルを支える。</p>
          <img className="e6-map" src="/images/e6-6e-map.png" alt="e6の6つのE全体図" />
          <dl className="e6-list-container">
            <dt>没入</dt>
            <dd>
              <ul className="e6-list">
                <li>
                  <strong>Education</strong>
                  <span>学びを得る</span>
                </li>
                <li>
                  <strong>Entertainment</strong>
                  <span>楽しみながら関わる</span>
                </li>
              </ul>
            </dd>
            </dl>
            <dl className="e6-list-container">
            <dt>判断</dt>
            <dd>
              <ul className="e6-list">
                <li>
                  <strong>Experience</strong>
                  <span>実際に体験する</span>
                </li>
                <li>
                  <strong>Emotion</strong>
                  <span>感情が動く</span>
                </li>
              </ul>
            </dd>
            </dl>
            <dl className="e6-list-container">
            <dt>覚醒</dt>
            <dd>
              <ul className="e6-list">
                <li>
                  <strong>Evolution</strong>
                  <span>変化していく</span>
                </li>
                <li>
                  <strong>Epiphany</strong>
                  <span>気づきが生まれる</span>
                </li>
              </ul>
            </dd>
          </dl>
          <a href="#" className="cta-button">6つのEの詳細ページへ</a>
        </section>

        <section
          className="block explain explain-body"
          data-index={6}
          ref={(el) => {
            sectionRefs.current[6] = el
          }}
        >
          <h2 className='about-e6-title'>e6とは</h2>
          <div className="about-e6">
            <p className="message-strong">
              理解を届けるのではなく、理解が立ち上がる体験をつくる。
            </p>
            <p>
              AIが“それらしい答え”を返す時代に、<br />
              本当に問われるのは「何を選ぶか」です。
            </p>

            <p>
              正解が外から与えられる時代だからこそ、<br />
              感情を羅針盤として、<br />
              体験の中で迷い、選び、気づく。
            </p>

            <p>
              その体験を、e6が設計し、<br />
              社会の中に実装していきます。
            </p>

            <div className="actions">
              <a href="#" className="cta-button">子どもたちへの想い</a>
              <a href="#" className="cta-button">協力企業</a>
              <a href="#" className="cta-button">e6の成り立ち</a>
            </div>

            <hr />

            <h3>第一弾：感情騎士 Emotional Knight</h3>
            <p>
              物語と体験を通じて感情を理解し、
              自分の選択と向き合うための具体的な取り組みです。
            </p>

            <a href="https://www.emotional-knight.com/" className="promo-banner">
              <img
                src="/images/emotional-knight-banner.png"
                alt="感情騎士 Emotional Knight プロモーションサイトへ"
              />
            </a>


            <div className="actions">
              <a href="#" className="cta-button">プロジェクトの紹介</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
