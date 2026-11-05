import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RolePage from './pages/RolePage';
import OwnerHomePage from './pages/OwnerHomePage';
import SuccessorHomePage from './pages/SuccessorHomePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/role" element={<RolePage />} />
      <Route path="/owner" element={<OwnerHomePage />} />
      <Route path="/successor" element={<SuccessorHomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
