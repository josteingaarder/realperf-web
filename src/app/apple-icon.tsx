import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
        }}
      >
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: 36,
            background: '#16d39a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(22, 211, 154, 0.24)',
          }}
        >
          <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
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
    ),
    {
      ...size,
    }
  );
}
