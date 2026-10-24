'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            maxWidth: '32rem', 
            textAlign: 'center',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <AlertTriangle 
                style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  color: '#ef4444',
                  margin: '0 auto'
                }} 
              />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Something Went Wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
