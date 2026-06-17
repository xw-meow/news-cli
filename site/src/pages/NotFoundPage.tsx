import { Link, useLocation } from 'react-router-dom';
import { TerminalBlock } from '../components/ui/TerminalBlock';

export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-lg mx-auto px-6 pt-20 pb-16 text-center">
      <TerminalBlock
        lines={[
          `$ news get ${pathname}`,
          `Error: source not found`,
        ]}
      />
      <Link
        to="/"
        className="inline-block mt-6 text-sm text-green-400 hover:text-green-300 transition-colors"
      >
        ← 返回首页
      </Link>
    </div>
  );
}
