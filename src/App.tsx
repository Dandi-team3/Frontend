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
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import ShopExplorePage from './pages/ShopExplorePage';
import ShopDetailPage from './pages/ShopDetailPage';
import MatchingHubPage from './pages/MatchingHubPage';
import EducationPage from './pages/EducationPage';
import MyPage from './pages/MyPage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import OnboardingProfilePage from './pages/OnboardingProfilePage';
import PolicyPage from './pages/PolicyPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DevToolsPage from './pages/DevToolsPage';

function RequireLogin({ children }: { children: ReactNode }) {
  const { me } = useApp();
  return me ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AppProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/role" element={<RolePage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />
          {import.meta.env.DEV && <Route path="/dev/tools" element={<DevToolsPage />} />}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/shops" element={<ShopExplorePage />} />
            <Route path="/shops/:id" element={<ShopDetailPage />} />
            <Route path="/matching" element={<MatchingHubPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/my" element={<MyPage />} />
            <Route path="/my/profile" element={<PersonalInfoPage />} />
            <Route path="/my/:document" element={<PolicyPage />} />
          </Route>
          <Route path="/owner" element={<RequireLogin><OwnerHomePage /></RequireLogin>} />
          <Route path="/successor" element={<RequireLogin><SuccessorHomePage /></RequireLogin>} />
          <Route path="/owner/register" element={<RequireLogin><RetirementPage /></RequireLogin>} />
          <Route path="/owner/shop" element={<RequireLogin><OwnerShopPage /></RequireLogin>} />
          <Route path="/owner/terms" element={<RequireLogin><OwnerTermsPage /></RequireLogin>} />
          <Route path="/successor/register" element={<RequireLogin><YouthRegistrationPage /></RequireLogin>} />
          <Route path="/owner/matches" element={<RequireLogin><MatchingPage /></RequireLogin>} />
          <Route path="/offers/current" element={<RequireLogin><OfferPage /></RequireLogin>} />
          <Route path="/succession/home" element={<RequireLogin><SuccessionHomePage /></RequireLogin>} />
          <Route path="/succession/schedule" element={<RequireLogin><SchedulePage /></RequireLogin>} />
          <Route path="/succession/checklist" element={<RequireLogin><ChecklistPage /></RequireLogin>} />
          <Route path="/succession/plan" element={<RequireLogin><PlanPage /></RequireLogin>} />
          <Route path="/succession/roadmap" element={<RequireLogin><RoadmapPage /></RequireLogin>} />
          <Route path="/succession/payments" element={<RequireLogin><PaymentsPage /></RequireLogin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AppProvider>
  );
}
