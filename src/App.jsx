import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/login';
import Main from './pages/Calendar/calendar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Navigate to="/login" replace />} /> 
      <Route path="/login" element={<Login />} />
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <Main />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
