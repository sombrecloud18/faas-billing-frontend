// src/pages/AdminPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { UserDetailView } from '../components/UserDetailView';

type TabType = 'users' | 'requests' | 'tariff-requests';

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
        <button
          onClick={() => setActiveTab('tariff-requests')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'tariff-requests' ? '#6ea8fe' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: '500'
          }}
        >
          Заявки на тарифы
        </button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'users' && <UsersTab onUserSelect={setSelectedUserId} onUserEmailSelect={setSelectedUserEmail} />}
      {activeTab === 'requests' && <RequestsTab />}
      {activeTab === 'tariff-requests' && <TariffRequestsTab />}
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

// Компонент вкладки заявок на тарифы
function TariffRequestsTab() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminTariffRequests'],
    queryFn: () => api.getTariffRequests(),
  });

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [proposedTariff, setProposedTariff] = useState({
    invocationsPrice: 0.01,
    durationPrice: 0.00001,
    cpuPrice: 0.000001,
    ramPrice: 0.000001,
    coldStartPrice: 0.1,
  });
  const [adminResponse, setAdminResponse] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрено';
      case 'rejected': return 'Отклонено';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const handleApprove = async () => {
    if (selectedRequest) {
      try {
        await api.approveTariffRequest(selectedRequest.id, proposedTariff, adminResponse);
        setSelectedRequest(null);
        setIsApprovalModalOpen(false);
        setAdminResponse('');
        refetch();
      } catch (error) {
        console.error('Ошибка при одобрении заявки:', error);
      }
    }
  };

  const handleReject = async () => {
    if (selectedRequest) {
      try {
        await api.rejectTariffRequest(selectedRequest.id, adminResponse);
        setSelectedRequest(null);
        setIsApprovalModalOpen(false);
        setAdminResponse('');
        refetch();
      } catch (error) {
        console.error('Ошибка при отклонении заявки:', error);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Заявки на изменение тарифов</h3>
        <button onClick={() => refetch()}>Обновить</button>
      </div>

      {isLoading && <div>Загрузка…</div>}
      {error && <div style={{ color: 'crimson' }}>Ошибка загрузки</div>}

      {!isLoading && !error && data && (
        <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ marginBottom: 8, opacity: 0.8 }}>Всего заявок: {data.requests.length}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Пользователь</th>
                <th style={th}>Описание</th>
                <th style={th}>Статус</th>
                <th style={th}>Дата создания</th>
                <th style={th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((request) => (
                <tr key={request.id}>
                  <td style={td}>{request.userEmail}</td>
                  <td style={td} title={request.description}>
                    {request.description.length > 50 
                      ? `${request.description.substring(0, 50)}...` 
                      : request.description}
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
                  <td style={td}>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsApprovalModalOpen(true);
                        }}
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
                        Рассмотреть
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно для рассмотрения заявки */}
      {isApprovalModalOpen && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: 24,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 600,
            maxWidth: 800,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>Рассмотрение заявки на тариф</h3>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>Пользователь: {selectedRequest.userEmail}</div>
              <div style={{ color: 'white', fontSize: 14, marginBottom: 12 }}>Описание:</div>
              <div style={{ 
                padding: 12, 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: 8, 
                color: 'white',
                marginBottom: 16
              }}>
                {selectedRequest.description}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'white', fontSize: 14, marginBottom: 12 }}>Предложенные цены:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16, maxWidth: '600px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'white', fontSize: 12 }}>Вызовы (₽)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={proposedTariff.invocationsPrice}
                    onChange={(e) => setProposedTariff(prev => ({ ...prev, invocationsPrice: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: 12
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'white', fontSize: 12 }}>Длительность (₽)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={proposedTariff.durationPrice}
                    onChange={(e) => setProposedTariff(prev => ({ ...prev, durationPrice: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: 12
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'white', fontSize: 12 }}>CPU (₽)</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={proposedTariff.cpuPrice}
                    onChange={(e) => setProposedTariff(prev => ({ ...prev, cpuPrice: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: 12
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'white', fontSize: 12 }}>RAM (₽)</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={proposedTariff.ramPrice}
                    onChange={(e) => setProposedTariff(prev => ({ ...prev, ramPrice: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: 12
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: 'white', fontSize: 12 }}>Холодные старты (₽)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={proposedTariff.coldStartPrice}
                    onChange={(e) => setProposedTariff(prev => ({ ...prev, coldStartPrice: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: 12
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, color: 'white', fontSize: 14 }}>
                Комментарий для клиента:
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Объясните решение или условия нового тарифа..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!adminResponse.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adminResponse.trim() ? '#dc3545' : 'rgba(220, 53, 69, 0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: adminResponse.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                Отклонить
              </button>
              <button
                onClick={handleApprove}
                disabled={!adminResponse.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adminResponse.trim() ? '#28a745' : 'rgba(40, 167, 69, 0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: adminResponse.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: '500'
                }}
              >
                Одобрить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 6px' };
const td: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 6px' };