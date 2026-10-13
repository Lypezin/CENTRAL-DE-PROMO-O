'use client'

import { useId } from 'react'

/** Vector recreation of the EntreGÔ Elite mark supplied for this campaign. */
export default function EliteBrandMark() {
  const id = useId().replace(/:/g, '')
  const badgeId = `${id}-badge`
  const shineId = `${id}-shine`
  const wordMaskId = `${id}-word`

  return (
    <svg className="elite-brand-svg" viewBox="0 0 440 240" width="440" height="240" role="img" aria-label="Elite EntreGÔ" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={badgeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6af9df" />
          <stop offset=".46" stopColor="#29dec9" />
          <stop offset="1" stopColor="#56efd1" />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff4a9" stopOpacity="0" />
          <stop offset=".42" stopColor="#fff4a9" stopOpacity=".16" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity=".92" />
          <stop offset=".6" stopColor="#fff4a9" stopOpacity=".2" />
          <stop offset="1" stopColor="#fff4a9" stopOpacity="0" />
        </linearGradient>
        <mask id={wordMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="440" height="200">
          <text x="52" y="153" textLength="331" lengthAdjust="spacingAndGlyphs" className="elite-svg-word" fill="white">Elite</text>
        </mask>
      </defs>

      <g className="elite-svg-badge" transform="rotate(-3.5 220 107)">
        <rect x="25" y="30" width="390" height="158" rx="12" fill="#071b3c" opacity=".38" transform="translate(1 7)" />
        <rect x="25" y="30" width="390" height="158" rx="11" fill={`url(#${badgeId})`} stroke="#9bffe9" strokeWidth="2" />
        <path d="M38 54 Q38 42 51 42 H387" fill="none" stroke="#d2fff2" strokeWidth="3" opacity=".38" />
        <text x="52" y="153" textLength="331" lengthAdjust="spacingAndGlyphs" className="elite-svg-word" fill="#071c48">Elite</text>
        <rect className="elite-svg-name-sweep" x="-105" y="32" width="110" height="156" fill={`url(#${shineId})`} mask={`url(#${wordMaskId})`} />
        <path className="elite-svg-star" d="M358 74 C361 94 367 101 385 104 C367 107 361 114 358 135 C355 114 349 107 331 104 C349 101 355 94 358 74Z" fill="#ffd058" />
      </g>
      <text x="220" y="227" textAnchor="middle" className="elite-svg-signature" fill="#ffffff">EntreGÔ</text>
    </svg>
  )
}
