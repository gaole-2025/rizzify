import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rizzify - AI Dating Photos'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D0D0F',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #A67F5A, #6CA3FF)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 20px 0',
            }}
          >
            Rizzify
          </h1>
          <p
            style={{
              fontSize: '36px',
              color: '#EDEBE6',
              margin: '0 0 20px 0',
              maxWidth: '800px',
              lineHeight: 1.2,
            }}
          >
            AI Dating Photos for Tinder, Bumble & Hinge
          </p>
          <p
            style={{
              fontSize: '24px',
              color: '#EDEBE6CC',
              margin: '0',
            }}
          >
            40-80 photos • 5-15 min delivery • Looks like you
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}