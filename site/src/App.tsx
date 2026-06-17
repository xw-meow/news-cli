import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { InstallPage } from './pages/InstallPage';
import { CommandsPage } from './pages/CommandsPage';
import { SourcesPage } from './pages/SourcesPage';

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-14 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/commands" element={<CommandsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
