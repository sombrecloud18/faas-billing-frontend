// src/App.tsx
import { Outlet, NavLink } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateRows: 'auto 1fr', 
      height: '100vh',
      width: '100%',
      margin: 0,
      padding: 0
    }}>
      <nav style={{ 
        display: 'flex', 
        gap: 12, 
        padding: 12, 
        borderBottom: '1px solid #eee',
        width: '100%'
      }}>
        <NavLink to="/login">Вход</NavLink>
        <NavLink to="/admin">Админ</NavLink>
        <NavLink to="/client">Клиент</NavLink> 
      </nav>
      <div style={{ 
        padding: 16,
        width: '100%',
        overflow: 'auto'
      }}>
        <Outlet />
      </div>
    </div>
  );
}