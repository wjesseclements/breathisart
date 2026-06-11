import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Research from './pages/Research';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/research" element={<Research />} />
    </Routes>
  );
}
