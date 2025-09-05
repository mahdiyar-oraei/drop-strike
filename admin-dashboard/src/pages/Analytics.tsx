import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Select,
  Alert,
  Spin,
  Tabs,
  Button,
  Statistic,
  Space,
} from 'antd';
import {
  RiseOutlined,
  UserOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import AnalyticsChart from '../components/Charts/AnalyticsChart';
import { format, subDays, subMonths } from 'date-fns';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Load different metrics based on current tab
      const metrics = ['users', 'coins', 'sessions', 'payouts'];
      const promises = metrics.map(metric => 
        adminApi.getAnalytics(timeframe, metric).catch(err => ({ success: false, error: err }))
      );

      const results = await Promise.all(promises);
      
      const data = {
        users: results[0].success ? (results[0] as any).data : null,
        coins: results[1].success ? (results[1] as any).data : null,
        sessions: results[2].success ? (results[2] as any).data : null,
        payouts: results[3].success ? (results[3] as any).data : null,
      };

      setAnalyticsData(data);

    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (dataType: string) => {
    try {
      const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      
      const response = await adminApi.exportData(dataType, startDate, endDate);
      
      if (response.success && response.data) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataType}-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const formatChartData = (data: any[], xKey: string, yKey: string) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      name: item[xKey] ? format(new Date(item[xKey]), 'MMM dd') : item.label || 'Unknown',
      value: item[yKey] || 0,
      ...item
    }));
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'users': return <UserOutlined />;
      case 'coins': return <DollarOutlined />;
      case 'sessions': return <PlayCircleOutlined />;
      case 'payouts': return <RiseOutlined />;
      default: return <RiseOutlined />;
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </Content>
    );
  }

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Analytics Dashboard
        </Title>
        <Text type="secondary">
          Detailed insights and reporting for your game's performance and user engagement.
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      )}

      {/* Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <Select
              placeholder="Timeframe"
              value={timeframe}
              onChange={setTimeframe}
              style={{ width: '100%' }}
            >
              <Option value="daily">Last 7 Days</Option>
              <Option value="weekly">Last 4 Weeks</Option>
              <Option value="monthly">Last 12 Months</Option>
            </Select>
          </Col>
          <Col xs={24} md={18}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('users')}
              >
                Export Users
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('payouts')}
              >
                Export Payouts
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('analytics')}
              >
                Export Analytics
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs activeKey={tabValue.toString()} onChange={(key) => setTabValue(parseInt(key))}>
        <TabPane tab="User Analytics" key="0">
          <Row gutter={[16, 16]}>
            {/* Summary Cards */}
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ color: '#1890ff', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Total Users"
                      value={analyticsData?.users?.summary?.totalUsers || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RiseOutlined style={{ color: '#52c41a', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title={`New Users (${timeframe})`}
                      value={analyticsData?.users?.summary?.newUsers || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlined style={{ color: '#13c2c2', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Active Users"
                      value={analyticsData?.users?.summary?.activeUsers || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <DollarOutlined style={{ color: '#faad14', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Retention Rate"
                      value={((analyticsData?.users?.summary?.retentionRate || 0) * 100).toFixed(1)}
                      suffix="%"
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            {/* User Growth Chart */}
            <Col xs={24} md={16}>
              <AnalyticsChart
                data={formatChartData(analyticsData?.users?.analyticsData || [], 'date', 'count')}
                type="area"
                title="User Growth Over Time"
                height={350}
              />
            </Col>

            {/* User Status Distribution */}
            <Col xs={24} md={8}>
              <AnalyticsChart
                data={[
                  { name: 'Active', value: analyticsData?.users?.summary?.activeUsers || 0 },
                  { name: 'Inactive', value: (analyticsData?.users?.summary?.totalUsers || 0) - (analyticsData?.users?.summary?.activeUsers || 0) },
                ]}
                type="pie"
                title="User Status Distribution"
                height={350}
              />
            </Col>
          </Row>
        </TabPane>

        {/* Revenue Analytics */}
        <TabPane tab="Revenue Analytics" key="1">
          <Row gutter={[16, 16]}>
            {/* Revenue Summary Cards */}
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <DollarOutlined style={{ color: '#52c41a', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Total Coins Distributed"
                      value={analyticsData?.coins?.summary?.totalCoinsDistributed || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RiseOutlined style={{ color: '#1890ff', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Total Payouts"
                      value={analyticsData?.payouts?.summary?.totalPayouts || 0}
                      prefix="$"
                      precision={2}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlined style={{ color: '#13c2c2', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Avg Coins per User"
                      value={analyticsData?.coins?.summary?.avgCoinsPerUser || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ color: '#faad14', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Payout Conversion Rate"
                      value={((analyticsData?.payouts?.summary?.conversionRate || 0) * 100).toFixed(1)}
                      suffix="%"
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            {/* Revenue Charts */}
            <Col xs={24} md={12}>
              <AnalyticsChart
                data={formatChartData(analyticsData?.coins?.analyticsData || [], 'date', 'amount')}
                type="bar"
                title="Coin Distribution Over Time"
                height={350}
              />
            </Col>

            <Col xs={24} md={12}>
              <AnalyticsChart
                data={formatChartData(analyticsData?.payouts?.analyticsData || [], 'date', 'amount')}
                type="line"
                title="Payouts Over Time"
                height={350}
              />
            </Col>
          </Row>
        </TabPane>

        {/* Engagement Analytics */}
        <TabPane tab="Engagement Analytics" key="2">
          <Row gutter={[16, 16]}>
            {/* Engagement Summary Cards */}
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PlayCircleOutlined style={{ color: '#1890ff', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Total Sessions"
                      value={analyticsData?.sessions?.summary?.totalSessions || 0}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RiseOutlined style={{ color: '#52c41a', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Avg Session Duration"
                      value={Math.round((analyticsData?.sessions?.summary?.avgSessionDuration || 0) / 60)}
                      suffix="m"
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ color: '#13c2c2', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Sessions per User"
                      value={analyticsData?.sessions?.summary?.avgSessionsPerUser?.toFixed(1) || '0.0'}
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <DollarOutlined style={{ color: '#faad14', marginRight: '8px', fontSize: '20px' }} />
                  <div>
                    <Statistic
                      title="Total Play Time"
                      value={analyticsData?.sessions?.summary?.totalEngagementTime ? 
                        Math.round(analyticsData.sessions.summary.totalEngagementTime / 3600) : 0}
                      suffix="h"
                      valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            {/* Engagement Charts */}
            <Col xs={24} md={16}>
              <AnalyticsChart
                data={formatChartData(analyticsData?.sessions?.analyticsData || [], 'date', 'count')}
                type="line"
                title="Daily Active Sessions"
                height={350}
              />
            </Col>

            <Col xs={24} md={8}>
              <AnalyticsChart
                data={formatChartData(analyticsData?.sessions?.hourlyData || [], 'hour', 'sessions')}
                type="bar"
                title="Sessions by Hour"
                height={350}
              />
            </Col>
          </Row>
        </TabPane>

        {/* Geographic Analytics */}
        <TabPane tab="Geographic Analytics" key="3">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card>
                <Title level={4} style={{ marginBottom: '16px' }}>
                  Users by Country
                </Title>
                {analyticsData?.users?.countryData ? (
                  <div>
                    {analyticsData.users.countryData.slice(0, 10).map((country: any, index: number) => (
                      <div key={country._id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 0',
                        borderBottom: index < 9 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <Text>{country._id || 'Unknown'}</Text>
                        <Space>
                          <Text type="secondary">
                            {((country.count / (analyticsData.users.summary?.totalUsers || 1)) * 100).toFixed(1)}%
                          </Text>
                          <Text strong>{country.count.toLocaleString()}</Text>
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">No geographic data available.</Text>
                )}
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <AnalyticsChart
                data={analyticsData?.users?.countryData?.slice(0, 5).map((country: any) => ({
                  name: country._id || 'Unknown',
                  value: country.count
                })) || []}
                type="pie"
                title="Top 5 Countries"
                height={350}
              />
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Content>
  );
};

export default Analytics;
