import React from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Statistic,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  WalletOutlined,
  PlayCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { DashboardStats as Stats } from '../../types';

interface DashboardStatsProps {
  stats: Stats;
}

const { Title, Text } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, subtitle }) => {
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        <Text type={isPositive ? 'success' : 'danger'}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Text>
      </div>
    );
  };

  return (
    <Card style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ color }}>
          {icon}
        </div>
        {change !== undefined && formatChange(change)}
      </div>
      
      <Title level={2} style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Title>
      
      <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
        {title}
      </Text>
      
      {subtitle && (
        <Text type="secondary">
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <StatCard
          title="Total Users"
          value={stats.users.total}
          change={stats.users.growthRate}
          icon={<UserOutlined style={{ fontSize: '24px' }} />}
          color="#1890ff"
          subtitle={`${stats.users.active} active users`}
        />
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <StatCard
          title="Coins Distributed"
          value={`${(stats.coins.totalDistributed / 1000).toFixed(1)}K`}
          icon={<WalletOutlined style={{ fontSize: '24px' }} />}
          color="#faad14"
          subtitle={`$${(stats.coins.totalDistributed * stats.coins.conversionRate).toFixed(2)} equivalent`}
        />
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <StatCard
          title="Active Sessions"
          value={stats.gaming.activeSessions}
          icon={<PlayCircleOutlined style={{ fontSize: '24px' }} />}
          color="#52c41a"
          subtitle={`${stats.gaming.totalSessions} total sessions`}
        />
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <StatCard
          title="Pending Payouts"
          value={stats.payouts.pending}
          icon={<DollarOutlined style={{ fontSize: '24px' }} />}
          color="#ff4d4f"
          subtitle={`$${stats.payouts.totalAmount.toFixed(2)} total paid`}
        />
      </Col>

      {/* Additional stats row */}
      <Col span={24}>
        <Card>
          <Title level={4} style={{ marginBottom: '16px' }}>
            Today's Activity
          </Title>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Statistic
                  title="New Users Today"
                  value={stats.users.newToday}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Statistic
                  title="Coins Distributed Today"
                  value={`${(stats.coins.distributedToday / 1000).toFixed(1)}K`}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <Statistic
                  title="Ad Views Today"
                  value={stats.system.todayAdViews}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* Top Countries */}
      <Col xs={24} md={12}>
        <Card style={{ height: '100%' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>
            Top Countries
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.topCountries.slice(0, 5).map((country, index) => (
              <div key={country.country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag color="blue">#{index + 1}</Tag>
                  <Text>{country.country}</Text>
                </div>
                <Text type="secondary">{country.users} users</Text>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* System Status */}
      <Col xs={24} md={12}>
        <Card style={{ height: '100%' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>
            System Status
          </Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Active Ad Rewards</Text>
              <Tag color="success">{stats.system.activeAdRewards}</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Pending Payouts</Text>
              <Tag color={stats.payouts.pending > 0 ? 'warning' : 'success'}>
                {stats.payouts.pending}
              </Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Completed Payouts</Text>
              <Tag color="blue">{stats.payouts.completed}</Tag>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardStats;
