import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
    </Routes>
  );
}
