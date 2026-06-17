import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';

export function App() {
  return (
    <>
      <Header />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
        </Routes>
      </main>
    </>
  );
}
