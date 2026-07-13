import { useEffect, useRef, useState, type ReactNode } from 'react'
import './HoverCard.css'

interface HoverCardProps {
  /** The small trigger control — usually an info icon. */
  trigger: ReactNode
  /** Rich panel content — paragraphs, lists, icons, whatever the info needs. */
  children: ReactNode
  label?: string
  /** Extra class on the trigger button — pass 'hover-card__trigger--plain' to
   * drop the default small circular icon-button styling for bigger triggers. */
  triggerClassName?: string
}

const VIEWPORT_MARGIN = 12
const CLOSE_DELAY = 120

/** The panel flips above the trigger when there isn't room below it, so `placement` has to
 * hold either value — not just the 'bottom' it happens to start on. */
interface Coords {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

/** Reveals a rich content panel on hover/focus — not a native title tooltip,
 * so it can hold headings, paragraphs, icons and lists. Repositions itself
 * (flips above, clamps horizontally) so it always stays fully on-screen. */
export function HoverCard({
  trigger,
  children,
  label = 'More information',
  triggerClassName,
}: HoverCardProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coords>({ top: -9999, left: -9999, placement: 'bottom' })

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = undefined
    }
  }

  function reposition() {
    const triggerEl = triggerRef.current
    const panelEl = panelRef.current
    if (!triggerEl || !panelEl) return

    const triggerRect = triggerEl.getBoundingClientRect()
    const panelRect = panelEl.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const placement =
      spaceBelow < panelRect.height + VIEWPORT_MARGIN && spaceAbove > spaceBelow ? 'top' : 'bottom'

    const top =
      placement === 'bottom'
        ? Math.min(triggerRect.bottom + 10, viewportHeight - panelRect.height - VIEWPORT_MARGIN)
        : triggerRect.top - panelRect.height - 10

    const spaceRight = viewportWidth - triggerRect.left
    const spaceLeft = triggerRect.right
    const preferredLeft =
      spaceRight >= panelRect.width + VIEWPORT_MARGIN || spaceRight >= spaceLeft
        ? triggerRect.left
        : triggerRect.right - panelRect.width

    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      viewportWidth - panelRect.width - VIEWPORT_MARGIN,
    )

    setCoords({ top: Math.max(top, VIEWPORT_MARGIN), left, placement })
  }

  function openPanel() {
    clearCloseTimer()
    reposition()
    setOpen(true)
  }

  function scheduleClose() {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
  }

  useEffect(() => {
    if (!open) return
    function handleScroll(e: Event) {
      // Scrolling *inside* the panel (its own overflow) shouldn't close it —
      // only scrolling the page behind it should.
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) {
        return
      }
      setOpen(false)
    }
    function handleResize() {
      setOpen(false)
    }
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  useEffect(() => () => clearCloseTimer(), [])

  return (
    <span className="hover-card">
      <button
        ref={triggerRef}
        type="button"
        className={`hover-card__trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
        aria-label={label}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
        onFocus={openPanel}
        onBlur={scheduleClose}
      >
        {trigger}
      </button>
      <div
        ref={panelRef}
        role="dialog"
        className={`hover-card__panel${open ? ' is-open' : ''}`}
        style={{ top: coords.top, left: coords.left }}
        data-placement={coords.placement}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        {children}
      </div>
    </span>
  )
}
