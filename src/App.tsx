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
import { DemoProvider } from './state/DemoContext';

export default function App() {
  return (
    <DemoProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/role" element={<RolePage />} />
        <Route path="/owner" element={<OwnerHomePage />} />
        <Route path="/successor" element={<SuccessorHomePage />} />
        <Route path="/owner/register" element={<RetirementPage />} />
        <Route path="/owner/shop" element={<OwnerShopPage />} />
        <Route path="/owner/terms" element={<OwnerTermsPage />} />
        <Route path="/successor/register" element={<YouthRegistrationPage />} />
        <Route path="/owner/matches" element={<MatchingPage />} />
        <Route path="/offers/current" element={<OfferPage />} />
        <Route path="/succession/schedule" element={<SchedulePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DemoProvider>
  );
}
