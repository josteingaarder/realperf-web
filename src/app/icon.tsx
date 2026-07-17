import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

function ChipLogo({ showShadow = false }: { showShadow?: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: '#16d39a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: showShadow ? '0 0 18px rgba(22, 211, 154, 0.35)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="7" y="7" width="10" height="10" rx="1.8" stroke="#000000" strokeWidth="2.2" />
          <rect x="10" y="10" width="4" height="4" rx="0.8" fill="#000000" />
          <path d="M12 3.5V6" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M12 18V20.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M3.5 12H6" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 12H20.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M6 6L7.4 7.4" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16.6 16.6L18 18" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18 6L16.6 7.4" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M7.4 16.6L6 18" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(<ChipLogo />, {
    ...size,
  });
}
