/** A stable per-symbol accent colour, used for avatar chips across the app. */
const AVATAR_HUES = ['#4f46e5', '#12b76a', '#f79009', '#7a5af8', '#0ba5ec', '#f04438', '#ee46bc']

export function avatarColor(symbol: string): string {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) % AVATAR_HUES.length
  return AVATAR_HUES[h]
}
