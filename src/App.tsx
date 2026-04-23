import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'

const sectionTitles = [
  '導入',
  '体験',
  '変化',
  '気づき',
  'サイクル',
  '6つのE',
  'e6とは',
]

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const mixColor = (a: [number, number, number], b: [number, number, number], amount: number) => {
  const t = clamp(amount)
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const b2 = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r} ${g} ${b2})`
}

function App() {
  const [stance, setStance] = useState(0.5)
  const [activeIndex, setActiveIndex] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [whiteTransition, setWhiteTransition] = useState(0)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const stancePct = Math.round(stance * 100)

  const dynamicStyle = useMemo(() => {
    const tone = mixColor([32, 120, 208], [255, 72, 128], stance)
    const soft = mixColor([16, 168, 255], [255, 72, 128], stance)
    const deep = mixColor([10, 19, 34], [38, 15, 40], stance)
    return {
      '--tone': tone,
      '--tone-soft': soft,
      '--tone-deep': deep,
      '--stance': String(stance),
      '--white-transition': String(whiteTransition),
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
    const root = viewportRef.current
    if (!root) {
      return
    }

    const onScroll = () => {
      const feedbackSection = sectionRefs.current[2]
      const pauseSection = sectionRefs.current[3]
      const cycleSection = sectionRefs.current[4]
      if (!feedbackSection || !pauseSection || !cycleSection) {
        return
      }

      const start = feedbackSection.offsetTop + feedbackSection.offsetHeight * 0.22
      const end = Math.min(
        pauseSection.offsetTop + pauseSection.offsetHeight * 0.88,
        cycleSection.offsetTop - 12,
      )
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
        <div className="wave-stack" aria-hidden="true">
          <svg className="wave-svg" viewBox="0 0 1200 220" preserveAspectRatio="none">
            <path
              className="wave wave-back"
              d="M0,200 C200,120 400,260 600,170 C800,80 1000,220 1200,140 L1200,220 L0,220 Z"
            />
            <path
              className="wave wave-mid"
              d="M0,210 C220,150 420,240 620,175 C820,110 1020,230 1200,165 L1200,220 L0,220 Z"
            />
            <path
              className="wave wave-front"
              d="M0,218 C240,175 460,225 640,185 C820,145 1000,215 1200,185 L1200,220 L0,220 Z"
            />
          </svg>
        </div>
        <section
          className="block intro"
          data-index={0}
          ref={(el) => {
            sectionRefs.current[0] = el
          }}
        >
          <div className="intro-words">
            <p>Experience</p>
            <p>Choice</p>
            <p>Insight</p>
          </div>
          <p className="intro-copy">没入・判断・覚醒 —— 体験から始まる</p>
          <button className="ghost" onClick={() => scrollToSection(1)}>
            触れてみる
          </button>
        </section>

        <section
          className="block stance"
          data-index={1}
          ref={(el) => {
            sectionRefs.current[1] = el
          }}
        >
          <h1>まずは、少しだけ体験してみてください</h1>
          <p className="hint">深く考えず、直感で動かしてみてください</p>

          <div className="characters" aria-hidden="true">
            <div className="char left" style={{ transform: `translateX(${stance * 20}px)` }}>
              向き合う
            </div>
            <div className="char right" style={{ transform: `translateX(-${(1 - stance) * 20}px)` }}>
              共に進む
            </div>
          </div>

          <div
            className="slider"
            role="slider"
            aria-label="関わり方のスタンス（入口の体験）"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stancePct}
            onPointerDown={(event) => {
              const target = event.currentTarget
              target.setPointerCapture(event.pointerId)
              handleDrag(event.clientX, target)
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) {
                handleDrag(event.clientX, event.currentTarget)
              }
            }}
          >
            <div className="slider-track">
              <div className="slider-thumb" style={{ left: `${stancePct}%` }} />
            </div>
          </div>

          <p className="balance">
            いまのあなたは、このあたりにいます（入口の感覚）
          </p>
        </section>

        <section
          className="block feedback"
          data-index={2}
          ref={(el) => {
            sectionRefs.current[2] = el
          }}
        >
          <div className="pulse" />
          <h2>選択は、見え方を変えます</h2>
          <p>
            選択によって、見えるものや感じ方が少し変わります。
          </p>
          <p>最後に意味を与えるのは、あなたです。</p>
        </section>

        <section
          className="block pause"
          data-index={3}
          ref={(el) => {
            sectionRefs.current[3] = el
          }}
        >
          <p>
            ここまでで体験してもらったことが、<br />
            <strong>e6そのもの</strong>です。
          </p>
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
          <ul className="e6-list">
            <li>
              <strong>Education</strong>
              <span>学びを得る</span>
            </li>
            <li>
              <strong>Entertainment</strong>
              <span>楽しみながら関わる</span>
            </li>
            <li>
              <strong>Experience</strong>
              <span>実際に体験する</span>
            </li>
            <li>
              <strong>Emotion</strong>
              <span>感情が動く</span>
            </li>
            <li>
              <strong>Evolution</strong>
              <span>変化していく</span>
            </li>
            <li>
              <strong>Epiphany</strong>
              <span>気づきが生まれる</span>
            </li>
          </ul>
          <a href="#" className="detail-link">6つのEの詳細ページへ</a>
        </section>

        <section
          className="block explain explain-body"
          data-index={6}
          ref={(el) => {
            sectionRefs.current[6] = el
          }}
        >
          <h2>e6とは</h2>
          <div className="about-e6">
            <p className="message-strong">
              理解を届けるのではなく、理解が立ち上がる体験をつくる。
            </p>
            <p>
              AIが“それらしい答え”を返す時代に、
              本当に問われるのは「何を選ぶか」です。
            </p>

            <p>
              正解が外から与えられる時代だからこそ、
              感情を羅針盤として、
              体験の中で迷い、選び、気づく。
            </p>

            <p>
              その体験を、e6が設計し、
              社会の中に実装していきます。
            </p>

            <div className="actions">
              <a href="#" className="cta-button">e6 project 公式ページへ</a>
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
            </a> {/* バナーに差し替え */}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
