import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Campus Lost & Found';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <div style={{ fontSize: 64, fontWeight: 'bold', marginBottom: 10 }}>
          Campus Lost & Found
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Reuniting items with their owners
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
