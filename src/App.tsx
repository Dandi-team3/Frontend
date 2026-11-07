import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RolePage from './pages/RolePage';
import OwnerHomePage from './pages/OwnerHomePage';
import SuccessorHomePage from './pages/SuccessorHomePage';
import RetirementPage from './pages/RetirementPage';
import OwnerShopPage from './pages/OwnerShopPage';
import OwnerTermsPage from './pages/OwnerTermsPage';
import YouthRegistrationPage from './pages/YouthRegistrationPage';
import MatchingPage from './pages/MatchingPage';
import OfferPage from './pages/OfferPage';
import SchedulePage from './pages/SchedulePage';
import ChecklistPage from './pages/ChecklistPage';
import PlanPage from './pages/PlanPage';
import RoadmapPage from './pages/RoadmapPage';
import SuccessionHomePage from './pages/SuccessionHomePage';
import PaymentsPage from './pages/PaymentsPage';
import { AppProvider, useApp } from './state/AppContext';

function RequireLogin({ children }: { children: ReactNode }) {
  const { me } = useApp();
  return me ? children : <Navigate to="/" replace />;
}

const PROTECTED_ROUTES: { path: string; element: ReactNode }[] = [
  { path: '/owner', element: <OwnerHomePage /> },
  { path: '/successor', element: <SuccessorHomePage /> },
  { path: '/owner/register', element: <RetirementPage /> },
  { path: '/owner/shop', element: <OwnerShopPage /> },
  { path: '/owner/terms', element: <OwnerTermsPage /> },
  { path: '/successor/register', element: <YouthRegistrationPage /> },
  { path: '/owner/matches', element: <MatchingPage /> },
  { path: '/offers/current', element: <OfferPage /> },
  { path: '/succession/home', element: <SuccessionHomePage /> },
  { path: '/succession/schedule', element: <SchedulePage /> },
  { path: '/succession/checklist', element: <ChecklistPage /> },
  { path: '/succession/plan', element: <PlanPage /> },
  { path: '/succession/roadmap', element: <RoadmapPage /> },
  { path: '/succession/payments', element: <PaymentsPage /> },
];

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/role" element={<RolePage />} />
        {PROTECTED_ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={<RequireLogin>{element}</RequireLogin>} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
