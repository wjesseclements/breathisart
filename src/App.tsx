import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Research from './pages/Research';
import { useApplyTheme } from './store/useApplyTheme';

export function App() {
  useApplyTheme();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/research" element={<Research />} />
    </Routes>
  );
}
