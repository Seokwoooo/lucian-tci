import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.css';
import './styles.css';
import App from './App';

const root = createRoot(document.getElementById('root')!);
const og = import.meta.env.DEV ? new URLSearchParams(location.search).get('og') : null;
if (import.meta.env.DEV && og !== null) {
  // Link-preview capture for scripts/generate-og.mjs; never part of a production build.
  const OgCard = lazy(() => import('./og/OgCard').then(async module => { await import('./og/og.css'); return module; }));
  root.render(<Suspense fallback={null}><OgCard slug={og} /></Suspense>);
} else {
  root.render(<StrictMode><App /></StrictMode>);
}
