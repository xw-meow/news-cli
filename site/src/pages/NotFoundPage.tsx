import { Link, useLocation } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-lg mx-auto px-6 pt-24 pb-16 text-center">
      <div className="text-8xl font-extrabold text-gradient mb-4">404</div>

      <TerminalBlock
        lines={[
          `$ news get ${pathname}`,
          'Error: source not found',
        ]}
      />

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 mt-8 text-sm text-green-400 hover:text-green-300 transition-colors bg-gray-900 border border-gray-800 rounded-lg px-4 py-2"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
