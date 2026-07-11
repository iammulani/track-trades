/** Inline SVG icons — no external dependency, currentColor-driven. */

export type IconName =
  | 'dashboard'
  | 'log'
  | 'about'
  | 'target'
  | 'dollar'
  | 'layers'
  | 'trending'
  | 'clock'
  | 'logo'
  | 'eye'
  | 'plus'
  | 'x'
  | 'search'
  | 'alert'
  | 'arrowUpRight'
  | 'arrowDownRight'

const PATHS: Record<IconName, string> = {
  dashboard: 'M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z',
  log: 'M4 5h16M4 12h16M4 19h10',
  about: 'M12 8v0m0 4v4m0-13a9 9 0 100 18 9 9 0 000-18z',
  target:
    'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 4a1 1 0 100 2 1 1 0 000-2z',
  dollar:
    'M12 2v20M17 6.5C17 4.6 14.8 3 12 3S7 4.6 7 6.5 9.2 10 12 10s5 1.6 5 3.5S14.8 17 12 17s-5-1.6-5-3.5',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  trending: 'M3 17l6-6 4 4 8-8M21 7v6M21 7h-6',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l3 2',
  logo: 'M4 14l5-5 4 4 7-7M4 20h16',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  alert:
    'M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 004 21h16a2 2 0 001.89-2.96L13.71 3.86a2 2 0 00-3.42 0z',
  arrowUpRight: 'M7 17L17 7M8 7h9v9',
  arrowDownRight: 'M7 7L17 17M17 8v9h-9',
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
