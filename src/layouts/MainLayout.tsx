import { Outlet } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { PublicUserCardModal } from '../components/layout/PublicUserCardModal';
import { UserMessagesBanner } from '../components/layout/UserMessagesBanner';

export function MainLayout() {
  return (
    <div className="rustic-shell flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="rustic-main mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <UserMessagesBanner />
        <Outlet />
      </main>
      <PublicUserCardModal />
      <Footer />
    </div>
  );
}
