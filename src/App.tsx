import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { unlockAudio } from './engine/audio';
import Home from './pages/Home';
import Research from './pages/Research';
import { useApplyTheme } from './store/useApplyTheme';

export function App() {
  useApplyTheme();

  // Audio can only start inside a user gesture (iOS Safari, Firefox).
  // Unlock the context on any interaction so later cues can play.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/research" element={<Research />} />
    </Routes>
  );
}
