export default function BrandLogo({ size = 'md', subtitle = 'Smarter Roads. Safer Cities.', showSubtitle = true, className = '' }) {
  const isLg = size === 'lg';
  const isSm = size === 'sm';
  
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Curved road 'C' emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${isLg ? 'w-14 h-14' : isSm ? 'w-8 h-8' : 'w-11 h-11'}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,102,255,0.25)]">
          <defs>
            <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#0047BA" />
            </linearGradient>
            <linearGradient id="roadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          {/* Circular C shape */}
          <path
            d="M50 10 C 72 10, 90 28, 90 50 C 90 58, 87 66, 82 72 C 77 62, 68 56, 50 56 C 36 56, 26 64, 20 74 C 13 67, 10 59, 10 50 C 10 28, 28 10, 50 10 Z"
            fill="url(#cGrad)"
          />
          {/* Swooping Road Path through bottom */}
          <path
            d="M16 78 C 30 62, 55 58, 88 78 C 84 86, 68 90, 50 90 C 35 90, 24 85, 16 78 Z"
            fill="url(#roadGrad)"
          />
          {/* Dashed Road Markings */}
          <path
            d="M 28 80 Q 48 70 76 81"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight text-[#0F172A] leading-tight flex items-center gap-1.5 ${isLg ? 'text-2xl' : isSm ? 'text-base' : 'text-xl'}`}>
          <span>CivicLens</span>
          <span className="text-[#0066FF]">AI</span>
        </div>
        {showSubtitle && (
          <span className={`text-slate-500 font-medium tracking-normal ${isLg ? 'text-xs' : isSm ? 'text-[10px]' : 'text-[11px]'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

