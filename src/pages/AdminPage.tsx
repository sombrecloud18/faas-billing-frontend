// src/pages/AdminPage.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';
import { UserDetailView } from '../components/UserDetailView';

type HourPoint = {
  ts: string;
  invocations: number;
  durationP95ms: number;
  coldStarts: number;
  cpuCoreMs: number;
  ramMbSec: number;
  cost: number;
};

type FnRow = {
  name: string;
  totals: {
    invocations: number;
    durationP95ms: number;
    coldStarts: number;
    cpuCoreMs: number;
    ramMbSec: number;
    cost: number;
  };
  series: Array<Omit<HourPoint, 'cost'> & { ts: string }>;
};

const METRICS = [
  { key: 'ramMbSec', title: 'RAM (MB·сек)' },
  { key: 'cpuCoreMs', title: 'CPU (ядро·мс)' },
  { key: 'invocations', title: 'Вызовы' },
  { key: 'durationP95ms', title: 'Длительность p95 (мс)' },
  { key: 'coldStarts', title: 'Холодные старты' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

type TabType = 'users' | 'requests';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // Если выбрана детальная страница пользователя
  if (selectedUserId && selectedUserEmail) {
    return (
      <UserDetailView
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        onBack={() => {
          setSelectedUserId(null);
          setSelectedUserEmail(null);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Админ‑панель</h2>
      </div>

      {/* Вкладки */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'users' ? '#6ea8fe' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: '500'
          }}
        >
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'requests' ? '#6ea8fe' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: '500'
          }}
        >
          Запросы
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'users' && <UsersTab onUserSelect={setSelectedUserId} onUserEmailSelect={setSelectedUserEmail} />}
      {activeTab === 'requests' && <RequestsTab />}
    </div>
  );
}

// Компонент вкладки пользователей
interface UsersTabProps {
  onUserSelect: (userId: string) => void;
  onUserEmailSelect: (email: string) => void;
}

function UsersTab({ onUserSelect, onUserEmailSelect }: UsersTabProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.getUsers(),
  });

  const handleUserClick = (user: { id: string; email: string; role: string }) => {
    onUserSelect(user.id);
    onUserEmailSelect(user.email);
  };

  return (
    <div>
      <div style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Список пользователей</h3>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка…</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {!isLoading && !error && data && (
        <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>Всего пользователей: {data.users.length}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Роль</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.users.filter(user => user.role === 'client').map((user) => (
                <tr key={user.id} style={{ cursor: 'pointer' }}>
                  <td style={td}>{user.email}</td>
                  <td style={td}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                      color: 'white',
                      fontSize: 12
                    }}>
                      {user.role === 'admin' ? 'Админ' : 'Клиент'}
                    </span>
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => handleUserClick(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6ea8fe',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Просмотр
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Компонент вкладки запросов
function RequestsTab() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDetailizationRequests'],
    queryFn: () => api.getDetailizationRequests(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'Обрабатывается';
      case 'completed': return 'Завершен';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Запросы на детализацию</h3>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка…</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {!isLoading && !error && data && (
        <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>Всего запросов: {data.requests.length}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Пользователь</th>
                <th style={th}>Период</th>
                <th style={th}>Статус</th>
                <th style={th}>Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((request) => (
                <tr key={request.id}>
                  <td style={td}>{request.userEmail}</td>
                  <td style={td}>
                    {new Date(request.startDate).toLocaleDateString('ru-RU')} - {new Date(request.endDate).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={td}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: getStatusColor(request.status),
                      color: 'white',
                      fontSize: 12
                    }}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td style={td}>{formatDate(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 6px' };
const td: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 6px' };