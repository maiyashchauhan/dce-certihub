// Default high-quality SVG assets for College Logo, Official Seal, and Signatures

export const DEFAULT_COLLEGE_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#F3E5AB" />
      <stop offset="100%" stop-color="#AA771C" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="3"/>
  <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldGrad)" stroke-width="1" stroke-dasharray="2,2"/>
  <!-- Laurel leaves -->
  <path d="M 28 48 C 24 38 32 30 35 34 C 30 38 32 44 28 48 Z" fill="url(#goldGrad)"/>
  <path d="M 24 60 C 20 52 26 46 30 49 C 26 52 27 57 24 60 Z" fill="url(#goldGrad)"/>
  <path d="M 72 48 C 76 38 68 30 65 34 C 70 38 68 44 72 48 Z" fill="url(#goldGrad)"/>
  <path d="M 76 60 C 80 52 74 46 70 49 C 74 52 73 57 76 60 Z" fill="url(#goldGrad)"/>
  <!-- Graduation cap & Torch / Book -->
  <path d="M 50 25 L 68 33 L 50 41 L 32 33 Z" fill="url(#goldGrad)"/>
  <polygon points="68,34 68,44 65,44 65,35" fill="url(#goldGrad)"/>
  <path d="M 40 46 L 50 42 L 60 46 L 60 62 L 50 58 L 40 62 Z" fill="#1e293b" stroke="url(#goldGrad)" stroke-width="2"/>
  <line x1="50" y1="42" x2="50" y2="58" stroke="url(#goldGrad)" stroke-width="2"/>
  <!-- Star -->
  <polygon points="50,66 52,72 58,72 53,76 55,82 50,78 45,82 47,76 42,72 48,72" fill="url(#goldGrad)"/>
</svg>
`)}`;

export const DEFAULT_OFFICIAL_SEAL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="sealGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#a16207"/>
    </radialGradient>
  </defs>
  <!-- Ribbon behind -->
  <polygon points="40,80 30,115 50,105 70,115 60,80" fill="#991b1b"/>
  <polygon points="60,80 50,115 70,105 90,115 80,80" fill="#b91c1c"/>
  <!-- Starburst teeth -->
  <circle cx="60" cy="55" r="45" fill="url(#sealGrad)" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"/>
  <circle cx="60" cy="55" r="38" fill="none" stroke="#713f12" stroke-width="1.5" stroke-dasharray="3,2"/>
  <circle cx="60" cy="55" r="32" fill="#ca8a04"/>
  <circle cx="60" cy="55" r="30" fill="url(#sealGrad)"/>
  <text x="60" y="46" font-family="serif" font-size="8" font-weight="bold" fill="#713f12" text-anchor="middle" letter-spacing="1">OFFICIAL</text>
  <text x="60" y="58" font-family="sans-serif" font-size="12" font-weight="900" fill="#713f12" text-anchor="middle">★ SEAL ★</text>
  <text x="60" y="69" font-family="serif" font-size="7" font-weight="bold" fill="#713f12" text-anchor="middle" letter-spacing="1">VERIFIED</text>
</svg>
`)}`;

export const DEFAULT_PRINCIPAL_SIGNATURE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <path d="M 20 50 Q 40 15 60 45 T 90 40 T 120 48 Q 140 20 155 55 T 180 35 Q 200 45 220 30" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35 60 Q 90 55 170 58" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 75 35 Q 85 20 80 48" fill="none" stroke="#0f172a" stroke-width="2"/>
  <path d="M 140 30 Q 150 15 145 50" fill="none" stroke="#0f172a" stroke-width="1.8"/>
</svg>
`)}`;

export const DEFAULT_COORDINATOR_SIGNATURE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <path d="M 25 45 Q 45 20 65 35 T 95 30 Q 120 10 135 48 T 165 40 T 205 32" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 45 55 Q 110 50 190 52" fill="none" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M 110 25 Q 120 10 115 50" fill="none" stroke="#1e293b" stroke-width="2"/>
</svg>
`)}`;

export const DEFAULT_HOD_SIGNATURE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <path d="M 30 50 Q 45 18 68 38 T 105 25 Q 130 15 140 50 T 175 35 Q 195 20 215 42" fill="none" stroke="#0f172a" stroke-width="2.3" stroke-linecap="round"/>
  <path d="M 40 58 Q 100 52 185 54" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 90 28 Q 100 12 95 45" fill="none" stroke="#0f172a" stroke-width="1.9"/>
  <circle cx="205" cy="52" r="2" fill="#0f172a"/>
</svg>
`)}`;

