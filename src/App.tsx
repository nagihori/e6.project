import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'

const sectionTitles = [
  '体験',
  '得意',
  '関わり方',
  '場',
  'フィードバック',
  '気づき',
  'サイクル',
  '6つのE',
  'e6について',
]

const Q1_OPTIONS = [
  { key: 'create',  label: '作る／描く', svg: '/images/01.svg' },
  { key: 'story',   label: '物語を書く', svg: '/images/02.svg' },
  { key: 'connect', label: '人をつなぐ', svg: '/images/03.svg' },
  { key: 'build',   label: '組み立てる', svg: '/images/04.svg' },
  { key: 'spread',  label: '広める',     svg: '/images/05.svg' },
]

const HINT_TEXTS = {
  create: {
    inner: {
      solo: {
        role: '世界観の探求者',
        hint: 'あなたの感性が、e6の世界をまだ誰も見たことのない形で可視化するかもしれない。',
      },
      together: {
        role: '表現の伴走者',
        hint: 'あなたが作るものが、誰かの体験の入口になる。その静かな貢献が、e6を深くする。',
      },
    },
    outer: {
      solo: {
        role: '感性の発信者',
        hint: 'あなたの表現が外へ出るとき、e6を知らない誰かの感情に火がつく。',
      },
      together: {
        role: '感性の触媒',
        hint: 'あなたが動くことで、周りの人の創造性が引き出される。e6はその化学反応を求めている。',
      },
    },
  },
  story: {
    inner: {
      solo: {
        role: '思想の翻訳者',
        hint: 'e6の概念を、あなた自身の言葉で静かに解釈し続けることが、思想を広げる力になる。',
      },
      together: {
        role: '言葉の編み手',
        hint: 'あなたの言葉が、誰かとe6の間に橋をかける。難しいことを届く言葉にできる人が必要だ。',
      },
    },
    outer: {
      solo: {
        role: '物語の架け橋',
        hint: 'あなたが書く物語が、e6を体験した人の気持ちを言語化し、次の誰かを引き寄せる。',
      },
      together: {
        role: '共鳴の語り部',
        hint: 'あなたの言葉は、人と人の間を流れる。e6の世界観を、あなた自身の声で広げてほしい。',
      },
    },
  },
  connect: {
    inner: {
      solo: {
        role: '余白の守り人',
        hint: '急がず、静かに。あなたが「場」の質を守ることで、e6に関わる人たちが安心して動ける。',
      },
      together: {
        role: '関係の育て手',
        hint: 'あなたは、人と人の間に生まれるものを大切にする。e6はそういう人に支えられて育つ。',
      },
    },
    outer: {
      solo: {
        role: '出会いの設計者',
        hint: 'あなたが動くと、出会うべき人たちが出会う。e6に必要な縁を、あなたが結べるかもしれない。',
      },
      together: {
        role: '出会いの編み手',
        hint: 'あなたがいる場所で、新しい何かが生まれる。人と人を引き合わせることが、e6を動かす。',
      },
    },
  },
  build: {
    inner: {
      solo: {
        role: '仕組みの観察者',
        hint: 'e6の体験の構造を読み解き、「こうすればもっとよくなる」という答えを持っている人が必要だ。',
      },
      together: {
        role: '構造の設計者',
        hint: 'あなたの設計力が、e6の体験を支える骨格になる。見えないところで世界を動かす仕事がある。',
      },
    },
    outer: {
      solo: {
        role: '可能性の拡張者',
        hint: 'あなたの技術やアイデアが、e6の体験を今よりずっと遠くへ連れていける。',
      },
      together: {
        role: '体験の共同設計者',
        hint: 'チームと共に、誰かの体験をつくる。あなたの組み立てる力が、e6の世界を広げる。',
      },
    },
  },
  spread: {
    inner: {
      solo: {
        role: '体験の記録者',
        hint: '深く感じたことを、自分の中に丁寧に積み重ねる。その蓄積がいつか、最も誠実な発信になる。',
      },
      together: {
        role: '伝播の起点',
        hint: 'あなたが誰かにe6を「伝えたい」と思う瞬間が、最も強い広まりの起点になる。',
      },
    },
    outer: {
      solo: {
        role: '波紋の起点',
        hint: '自分が動くことで、周りの誰かが動き始める。あなたの発信がe6を知らない世界へ届く。',
      },
      together: {
        role: 'ムーブメントの核',
        hint: 'あなたが中心にいると、人が集まり、動きが生まれる。e6の広がりに、あなたの熱が必要だ。',
      },
    },
  },
} as const

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const remapProgress = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start))

const mixColor = (
  a: [number, number, number],
  b: [number, number, number],
  amount: number,
) => {
  const t = clamp(amount)
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const b2 = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r} ${g} ${b2})`
}

const ICON_MIN_SIZE = 64
const ICON_MAX_SIZE = 216
const FEEDBACK_RESULT_SCALE = 1.35
const getIconSize = (value: number) => Math.round(ICON_MIN_SIZE + value * (ICON_MAX_SIZE - ICON_MIN_SIZE))
const GHOST_REFERENCE_SIZE = getIconSize(0.5)
const FEEDBACK_RESULT_STAGE_SIZE = 280
const FEEDBACK_GHOST_REFERENCE_SIZE = Math.round(GHOST_REFERENCE_SIZE * FEEDBACK_RESULT_SCALE)

type IconDisplayProps = {
  iconSrc: string | null
  size: number
  color: string
  showGhost?: boolean
  ghostSize?: number
  stageSize?: number
}

function IconDisplay({
  iconSrc,
  size,
  color,
  showGhost = false,
  ghostSize = GHOST_REFERENCE_SIZE,
  stageSize,
}: IconDisplayProps) {
  const containerSize = stageSize ?? (showGhost ? Math.max(size, ghostSize) : size)
  const iconMaskStyle = iconSrc
    ? ({
        '--icon-src': `url(${iconSrc})`,
        '--icon-color': color,
      } as CSSProperties)
    : undefined

  return (
    <div
      className={`icon-display${showGhost ? ' icon-display--with-ghost' : ''}`}
      style={{
        width: containerSize,
        height: containerSize,
        minWidth: containerSize,
        minHeight: containerSize,
      }}
    >
      {showGhost && iconSrc && (
        <div
          className="icon-ghost icon-mask"
          style={{
            ...iconMaskStyle,
            width: ghostSize,
            height: ghostSize,
          }}
        />
      )}
      {iconSrc ? (
        <div
          key={iconSrc}
          className="icon-display-img icon-mask"
          style={{
            ...iconMaskStyle,
            width: size,
            height: size,
          }}
        />
      ) : (
        <div className="icon-placeholder" style={{ width: size, height: size }} />
      )}
    </div>
  )
}

function App() {
  const [q1, setQ1] = useState<string | null>(null)
  const [q2, setQ2] = useState(0.5)
  const [q3, setQ3] = useState(0.5)
  const [isDraggingQ2, setIsDraggingQ2] = useState(false)
  const [isDraggingQ3, setIsDraggingQ3] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [headerOpen, setHeaderOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whiteTransition, setWhiteTransition] = useState(0)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Array<HTMLElement | null>>([])

  const selectedOption = Q1_OPTIONS.find((o) => o.key === q1)
  const iconSrc = selectedOption?.svg ?? null
  const iconSize = getIconSize(q3)
  const toneColor = mixColor([32, 120, 208], [255, 72, 128], q2)
  const feedbackIconSize = Math.min(
    FEEDBACK_RESULT_STAGE_SIZE,
    Math.round(iconSize * FEEDBACK_RESULT_SCALE),
  )
  const q2Label = q2 < 0.35 ? '向き合う' : q2 > 0.65 ? '共に進む' : '行き来する'
  const q3Label = q3 < 0.35 ? '自分の中から' : q3 > 0.65 ? '外の世界へ' : '境界をまたいで'
  const hintAxisQ2 = q2 < 0.5 ? 'solo' : 'together'
  const hintAxisQ3 = q3 < 0.5 ? 'inner' : 'outer'
  const selectedHint = selectedOption
    ? HINT_TEXTS[selectedOption.key as keyof typeof HINT_TEXTS][hintAxisQ3][hintAxisQ2]
    : null
  const shareHeadline = selectedHint?.hint
    ?? (selectedOption
      ? `${selectedOption.label}を起点に、${q2Label}ように、${q3Label}動く。`
      : '直感から始めて、自分なりの動き方を見つける。')
  const relationHintRole = selectedHint?.role ?? '関わり方のヒント'
  const relationHint = selectedHint?.hint ?? 'ここに関わり方ヒントが入ります。'
  const sharePrompt = 'あなたはe6でどう動きますか？'
  const shareTag = '#e6ならこう動く'
  const shareText = `${sharePrompt}\n${relationHintRole}\n${shareHeadline}\n${shareTag}`

  const dynamicStyle = useMemo(() => {
    const soft = mixColor([16, 168, 255], [255, 140, 80], q2)
    const deep = mixColor([10, 19, 34], [38, 15, 40], q2)
    return {
      '--tone': mixColor([32, 120, 208], [255, 72, 128], q2),
      '--tone-soft': soft,
      '--tone-deep': deep,
      '--q2': String(q2),
      '--q3': String(q3),
      '--ui-radius': `${4 + q2 * 24}px`,
      '--white-transition': String(remapProgress(whiteTransition, 0.2, 0.8)),
      '--white-transition-text': String(remapProgress(whiteTransition, 0.28, 0.88)),
    } as CSSProperties
  }, [q2, q3, whiteTransition])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) return
    const sections = sectionRefs.current.filter((s): s is HTMLElement => !!s)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            if (!Number.isNaN(index)) setActiveIndex(index)
          }
        })
      },
      { root, threshold: 0.65 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) return
    const onScroll = () => {
      const pauseSection = sectionRefs.current[5]
      if (!pauseSection) return
      const start = pauseSection.offsetTop - root.clientHeight
      const end = pauseSection.offsetTop
      const distance = Math.max(1, end - start)
      setWhiteTransition(clamp((root.scrollTop - start) / distance, 0, 1))
    }
    onScroll()
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const handleSliderDrag = (
    clientX: number,
    target: HTMLDivElement,
    setter: (v: number) => void,
  ) => {
    const rect = target.getBoundingClientRect()
    setter(clamp((clientX - rect.left) / rect.width))
  }

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMapOpen(false)
    setHeaderOpen(false)
  }

  const closeShareAndScrollToSection = (index: number) => {
    setShareOpen(false)
    scrollToSection(index)
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="prototype" style={dynamicStyle}>
      <aside className={`minimap ${mapOpen ? 'open' : ''} ${activeIndex >= 5 ? 'follow light' : 'rest'}`}>
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

        {/* 0: Intro */}
        <section
          className="block intro"
          data-index={0}
          ref={(el) => { sectionRefs.current[0] = el }}
        >
          <header>
            <img src="/images/e6_logo_yoko_big.png" alt="e6 logo" />
            <button
              className="header-nav-toggle"
              aria-expanded={headerOpen}
              aria-controls="header-nav"
              onClick={() => setHeaderOpen((prev) => !prev)}
            >
              {headerOpen ? '閉じる' : 'MENU'}
            </button>
            <ul id="header-nav" className={`header-nav ${headerOpen ? 'open' : ''}`}>
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
              <button className="skip-link" onClick={() => scrollToSection(6)}>
                SKIP
              </button>
            </div>
          </div>
        </section>

        {/* 1: Q1 — 得意 */}
        <section
          className="block q1-section"
          data-index={1}
          ref={(el) => { sectionRefs.current[1] = el }}
        >
          <div className="q-prompt">
            <div className="q-step">
              <span className="q-step-dot active" /><span className="q-step-dot" /><span className="q-step-dot" />
            </div>
            <p className="hint">直感で、一番近いものを</p>
            <h2>あなたの得意は？</h2>
          </div>
          <IconDisplay iconSrc={iconSrc} size={iconSize} color={toneColor} stageSize={ICON_MAX_SIZE} />
          <div className="q1-grid">
            {Q1_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`q1-card${q1 === option.key ? ' selected' : ''}`}
                onClick={() => setQ1(option.key)}
              >
                <span className="q1-label">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="q-actions">
            <button className="ghost" disabled={!q1} onClick={() => scrollToSection(2)}>次へ</button>
          </div>
        </section>

        {/* 2: Q2 — 関わり方 */}
        <section
          className="block q2-section"
          data-index={2}
          ref={(el) => { sectionRefs.current[2] = el }}
        >
          <div className="q-prompt">
            <div className="q-step">
              <span className="q-step-dot active" /><span className="q-step-dot active" /><span className="q-step-dot" />
            </div>
            <p className="hint">深く考えず、直感で</p>
            <h2>どう関わる？</h2>
          </div>
          <IconDisplay iconSrc={iconSrc} size={iconSize} color={toneColor} stageSize={ICON_MAX_SIZE} />
          <div className="q-controls">
            <div
              className="slider q-surface"
              data-dragging={isDraggingQ2 ? 'true' : 'false'}
              role="slider"
              aria-label="関わり方のスタンス"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(q2 * 100)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setIsDraggingQ2(true)
                handleSliderDrag(e.clientX, e.currentTarget, setQ2)
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleSliderDrag(e.clientX, e.currentTarget, setQ2)
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId)
                setIsDraggingQ2(false)
              }}
              onPointerCancel={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId)
                setIsDraggingQ2(false)
              }}
            >
              <div className="q-side left">向き合う</div>
              <div className="q-side right">共に進む</div>
              <div className="slider-track">
                <div className="slider-thumb" style={{ left: `${Math.round(q2 * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="q-actions">
            <button className="ghost" onClick={() => scrollToSection(3)}>次へ</button>
          </div>
        </section>

        {/* 3: Q3 — 場 */}
        <section
          className="block q3-section"
          data-index={3}
          ref={(el) => { sectionRefs.current[3] = el }}
        >
          <div className="q-prompt">
            <div className="q-step">
              <span className="q-step-dot active" /><span className="q-step-dot active" /><span className="q-step-dot active" />
            </div>
            <p className="hint">深く考えず、直感で</p>
            <h2>あなたの場は？</h2>
          </div>
          <IconDisplay
            iconSrc={iconSrc}
            size={iconSize}
            color={toneColor}
            showGhost={true}
            ghostSize={GHOST_REFERENCE_SIZE}
            stageSize={ICON_MAX_SIZE}
          />
          <div className="q-controls">
            <div
              className="slider q-surface"
              data-dragging={isDraggingQ3 ? 'true' : 'false'}
              role="slider"
              aria-label="活動の場"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(q3 * 100)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setIsDraggingQ3(true)
                handleSliderDrag(e.clientX, e.currentTarget, setQ3)
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleSliderDrag(e.clientX, e.currentTarget, setQ3)
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId)
                setIsDraggingQ3(false)
              }}
              onPointerCancel={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId)
                setIsDraggingQ3(false)
              }}
            >
              <div className="q-side left">自分の中で</div>
              <div className="q-side right">外の世界で</div>
              <div className="slider-track">
                <div className="slider-thumb" style={{ left: `${Math.round(q3 * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="q-actions">
            <button className="ghost" onClick={() => scrollToSection(4)}>次へ</button>
          </div>
        </section>

        {/* 4: Feedback */}
        <section
          className="block feedback"
          data-index={4}
          ref={(el) => { sectionRefs.current[4] = el }}
        >
          <h2>選択は、見え方を変えます</h2>
          <IconDisplay
            iconSrc={iconSrc}
            size={feedbackIconSize}
            color={toneColor}
            showGhost={true}
            ghostSize={FEEDBACK_GHOST_REFERENCE_SIZE}
            stageSize={FEEDBACK_RESULT_STAGE_SIZE}
          />
          <div className="feedback-summary">
            <div className="feedback-item">
              <span className="feedback-label">得意</span>
              {iconSrc ? (
                <div
                  className="feedback-icon"
                  style={{
                    '--icon-src': `url(${iconSrc})`,
                    '--icon-color': toneColor,
                  } as CSSProperties}
                />
              ) : (
                <div className="feedback-icon-empty" />
              )}
            </div>
            <div className="feedback-item">
              <span className="feedback-label">関わり方</span>
              <div className="feedback-color-dot" style={{ background: toneColor }} />
            </div>
            <div className="feedback-item">
              <span className="feedback-label">場</span>
              <div
                className="feedback-size-dot"
                style={{ width: Math.round(iconSize * 0.3), height: Math.round(iconSize * 0.3) }}
              />
            </div>
          </div>
          <p>選択によって、世界の感じ方が少し変わります。</p>
          <div className="feedback-actions">
            <button className="ghost feedback-next" onClick={() => scrollToSection(5)}>
              そして
            </button>
            <button className="skip-link feedback-reset" onClick={() => scrollToSection(1)}>
              選び直す
            </button>
          </div>
        </section>

        {/* 5: Pause */}
        <section
          className="block pause"
          data-index={5}
          ref={(el) => { sectionRefs.current[5] = el }}
        >
          <div className="pause-card">
            <IconDisplay
              iconSrc={iconSrc}
              size={Math.min(iconSize, 164)}
              color={toneColor}
              showGhost={true}
              ghostSize={GHOST_REFERENCE_SIZE}
              stageSize={188}
            />
            {selectedHint && (
              <div className="pause-hint">
                <p className="pause-hint-label">関わり方のヒント</p>
                <p className="pause-hint-role">{relationHintRole}</p>
                <p className="pause-copy">{relationHint}</p>
                <p className="pause-hint-note">しっくりこなくても、その違和感ごとあなたの判断です。</p>
              </div>
            )}
            <h2>最後に意味を与えるのは、<strong>あなた。</strong></h2>
            <p className="pause-label">この体験が <strong>e6</strong>です。</p>
            <div className="pause-actions">
              <button className="ghost pause-action-primary" onClick={() => scrollToSection(6)}>
                e6について知る
              </button>
            </div>
          </div>
          <p className="pause-scroll-cue">SCROLL ↓</p>
        </section>

        {/* 6: Cycle */}
        <section
          className="block free-scroll cycle explain-area explain-entry"
          data-index={6}
          ref={(el) => { sectionRefs.current[6] = el }}
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

        {/* 7: 6つのE */}
        <section
          className="block free-scroll sixe explain-body"
          data-index={7}
          ref={(el) => { sectionRefs.current[7] = el }}
        >
          <h2>6つのE</h2>
          <p>6つのEが、没入・判断・覚醒のサイクルを支える。</p>
          <img className="e6-map" src="/images/e6-6e-map.png" alt="e6の6つのE全体図" />
          <dl className="e6-list-container">
            <dt>没入</dt>
            <dd>
              <ul className="e6-list">
                <li><strong>Education</strong><span>学びを得る</span></li>
                <li><strong>Entertainment</strong><span>楽しみながら関わる</span></li>
              </ul>
            </dd>
          </dl>
          <dl className="e6-list-container">
            <dt>判断</dt>
            <dd>
              <ul className="e6-list">
                <li><strong>Experience</strong><span>実際に体験する</span></li>
                <li><strong>Emotion</strong><span>感情が動く</span></li>
              </ul>
            </dd>
          </dl>
          <dl className="e6-list-container">
            <dt>覚醒</dt>
            <dd>
              <ul className="e6-list">
                <li><strong>Evolution</strong><span>変化していく</span></li>
                <li><strong>Epiphany</strong><span>気づきが生まれる</span></li>
              </ul>
            </dd>
          </dl>
          <a href="#" className="cta-button">6つのEの詳細ページへ</a>
        </section>

        {/* 8: e6について */}
        <section
          className="block free-scroll explain explain-body"
          data-index={8}
          ref={(el) => { sectionRefs.current[8] = el }}
        >
          <h2 className="about-e6-title">e6とは</h2>
          <div className="about-e6">
            <p className="message-strong">
              理解を届けるのではなく、理解が立ち上がる体験をつくる。
            </p>
            <p>
              AIが"それらしい答え"を返す時代に、<br />
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

      {activeIndex >= 5 && !shareOpen && (
        <button
          className="share-fab"
          onClick={() => (selectedHint ? setShareOpen(true) : scrollToSection(1))}
        >
          <span className="share-fab-icon" aria-hidden="true">↗</span>
          <span>{selectedHint ? '#e6ならこう動く' : '体験する'}</span>
        </button>
      )}

      {shareOpen && (
        <div className="share-overlay" role="dialog" aria-modal="true" aria-label="シェアパネル">
          <div className="share-panel">
            <button className="share-close" onClick={() => setShareOpen(false)} aria-label="閉じる">
              ×
            </button>
            <p className="share-eyebrow">語ることが、参加の第一歩になる</p>
            <h3>{sharePrompt}</h3>
            <div className="share-card">
              <IconDisplay
                iconSrc={iconSrc}
                size={Math.min(iconSize, 150)}
                color={toneColor}
                showGhost={true}
                ghostSize={GHOST_REFERENCE_SIZE}
                stageSize={176}
              />
              <p className="share-card-role">{relationHintRole}</p>
              <p className="share-card-copy">{shareHeadline}</p>
              <div className="share-meta">
                <span>{selectedOption?.label ?? 'まだ選択中'}</span>
                <span>{q2Label}</span>
                <span>{q3Label}</span>
              </div>
            </div>
            <p className="share-tag">{shareTag}</p>
            <div className="share-actions">
              <button className="ghost" onClick={handleCopyShare}>
                {copied ? 'コピーしました' : 'シェア文をコピー'}
              </button>
              <button className="skip-link share-knowledge-link" onClick={() => closeShareAndScrollToSection(6)}>
                e6について知る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
