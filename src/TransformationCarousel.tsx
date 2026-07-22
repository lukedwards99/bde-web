import { useEffect, useMemo, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
import type { Transformation } from './transformations'

type TransformationCarouselProps = {
  transformations: Transformation[]
}

type Phase = 'Before' | 'After'

type TransformationSlide = {
  key: string
  person: Transformation
  phase: Phase
  image: string
}

const AUTOPLAY_INTERVAL = 6000

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReducedMotion(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

function TransformationCarousel({ transformations }: TransformationCarouselProps) {
  const slides = useMemo<TransformationSlide[]>(() => transformations.flatMap((person) => [
    { key: `${person.id}-before`, person, phase: 'Before', image: person.before },
    { key: `${person.id}-after`, person, phase: 'After', image: person.after },
  ]), [transformations])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [manuallyPaused, setManuallyPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const [pageHidden, setPageHidden] = useState(() => document.hidden)
  const [announcement, setAnnouncement] = useState('')
  const reducedMotion = useReducedMotion()

  const autoplayPaused = manuallyPaused || isHovered || hasFocus || pageHidden || reducedMotion
  const currentSlide = slides[currentIndex]

  useEffect(() => {
    const handleVisibilityChange = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (autoplayPaused || slides.length < 2) return

    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length)
    }, AUTOPLAY_INTERVAL)

    return () => window.clearInterval(interval)
  }, [autoplayPaused, slides.length])

  if (!currentSlide) return null

  const announceSlide = (index: number) => {
    const slide = slides[index]
    setAnnouncement(
      `${slide.person.name}, ${slide.phase.toLowerCase()} photo, ${index + 1} of ${slides.length}.`,
    )
  }

  const goTo = (index: number) => {
    const nextIndex = (index + slides.length) % slides.length
    setCurrentIndex(nextIndex)
    announceSlide(nextIndex)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(currentIndex - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(currentIndex + 1)
    }
  }

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
  }

  const { person, phase } = currentSlide
  const hasStats = person.age !== undefined || person.beforeWeight || person.afterWeight

  return (
    <section
      className="transformations section"
      id="transformations"
      aria-labelledby="transformations-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="section-heading transformations-heading">
        <p className="eyebrow">Progress, made visible</p>
        <h2 id="transformations-title">Real transformations.</h2>
        <p>Individual journeys built through consistent coaching, thoughtful training, and work that compounds.</p>
      </div>

      <div className="transformation-card">
        <div className="transformation-photo" aria-live="off">
          <img
            key={currentSlide.key}
            src={currentSlide.image}
            alt={`${person.name}'s ${phase.toLowerCase()} transformation photo`}
          />
          <span className={`phase-label phase-label-${phase.toLowerCase()}`}>{phase}</span>
          <span className="slide-count" aria-hidden="true">
            {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        <div className="transformation-details">
          <div>
            <p className="eyebrow">Client transformation</p>
            <h3>{person.name}</h3>
            <p className="current-phase">
              <span>{phase}</span> · Photo {currentIndex + 1} of {slides.length}
            </p>
          </div>

          {hasStats && (
            <dl className="transformation-stats">
              {person.age !== undefined && (
                <div>
                  <dt>Age</dt>
                  <dd>{person.age}</dd>
                </div>
              )}
              {person.beforeWeight && (
                <div className={phase === 'Before' ? 'is-current' : undefined}>
                  <dt>Before</dt>
                  <dd>{person.beforeWeight}</dd>
                </div>
              )}
              {person.afterWeight && (
                <div className={phase === 'After' ? 'is-current' : undefined}>
                  <dt>After</dt>
                  <dd>{person.afterWeight}</dd>
                </div>
              )}
            </dl>
          )}

          {person.about && <p className="transformation-about">{person.about}</p>}

          <div className="carousel-controls" aria-label="Transformation carousel controls">
            <div className="carousel-buttons">
              <button type="button" onClick={() => goTo(currentIndex - 1)} aria-label="Previous transformation photo">
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={() => setManuallyPaused((paused) => !paused)}
                aria-label={reducedMotion
                  ? 'Autoplay disabled because reduced motion is enabled'
                  : manuallyPaused
                    ? 'Play transformation carousel'
                    : 'Pause transformation carousel'}
                aria-pressed={manuallyPaused}
                disabled={reducedMotion}
              >
                <span aria-hidden="true">{manuallyPaused ? '▶' : 'Ⅱ'}</span>
              </button>
              <button type="button" onClick={() => goTo(currentIndex + 1)} aria-label="Next transformation photo">
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="carousel-dots" aria-label="Choose a transformation photo">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  className={index === currentIndex ? 'is-current' : undefined}
                  onClick={() => goTo(index)}
                  aria-label={`Show ${slide.person.name}'s ${slide.phase.toLowerCase()} photo`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </section>
  )
}

export default TransformationCarousel
