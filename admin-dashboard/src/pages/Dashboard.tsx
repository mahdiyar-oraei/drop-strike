import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Alert,
  Spin,
} from 'antd';
import DashboardStats from '../components/Dashboard/DashboardStats';
import { adminApi } from '../services/api';
import { DashboardStats as Stats } from '../types';

const { Content } = Layout;
const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('An error occurred while loading dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spin size="large" />
        </div>
      </Content>
    );
  }

  if (error) {
    return (
      <Content style={{ padding: '24px' }}>
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Dashboard Overview
        </Title>
        <Text type="secondary">
          Welcome to the Drop Strike admin dashboard. Monitor your game's performance and manage users.
        </Text>
      </div>

      {stats && <DashboardStats stats={stats} />}
    </Content>
  );
};

export default Dashboard;
