import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-14 flex-1">
        <Routes>
          <Route path="/" element={<div className="p-8 text-green-400 font-mono">news-cli</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
