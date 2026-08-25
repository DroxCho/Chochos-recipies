import { NavLink } from 'react-router-dom';

export function Header() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-sm font-medium text-slate-900'
      : 'text-sm font-medium text-slate-500 transition-colors hover:text-slate-900';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Recipes</h1>
        <nav className="flex items-center gap-4" aria-label="Main navigation">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/recipes" className={linkClass}>
            Recipes
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
