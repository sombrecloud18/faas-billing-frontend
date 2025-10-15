// src/App.tsx
import { Outlet, NavLink } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh' }}>
      <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
        <NavLink to="/login">Вход</NavLink>
        <NavLink to="/admin">Админ</NavLink>
        <NavLink to="/client">Клиент</NavLink> 
      </nav>
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}