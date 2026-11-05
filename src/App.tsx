import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      {/* 다음 화면(역할 선택 등)은 여기에 추가 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
