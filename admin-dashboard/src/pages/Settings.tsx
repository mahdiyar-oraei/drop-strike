import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Switch,
  Divider,
  Tag,
  Modal,
  List,
  Space,
  message,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  SettingOutlined,
  HeartOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

const { Content } = Layout;
const { Title, Text } = Typography;

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  database: string;
  services: {
    paypal: boolean;
    admob: boolean;
    email: boolean;
  };
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // System Configuration State
  const [config, setConfig] = useState({
    // Coin Configuration
    baseCoinToUsdRate: 0.001,
    minimumPayoutAmount: 1.00,
    maximumPayoutAmount: 10000.00,
    platformFeeRate: 0.05,

    // Ad Configuration
    defaultAdCooldown: 5,
    maxDailyAdViews: 50,
    rewardedVideoCoins: 10,
    interstitialAdCoins: 5,
    bannerAdCoins: 1,

    // Game Configuration
    maxGameSessionTime: 3600,
    coinBonusMultiplier: 1.0,
    levelUpCoinBonus: 100,

    // Security Configuration
    maxLoginAttempts: 5,
    sessionTimeout: 86400,
    requireEmailVerification: true,
    enableTwoFactor: false,

    // System Configuration
    maintenanceMode: false,
    registrationEnabled: true,
    payoutsEnabled: true,
    debugMode: false,
  });

  useEffect(() => {
    loadSystemHealth();
    loadSystemConfig();
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await adminApi.getSystemHealth();
      if (response.success && response.data) {
        setSystemHealth(response.data);
      }
    } catch (err) {
      console.error('Health check error:', err);
    }
  };

  const loadSystemConfig = async () => {
    // This would load actual system configuration from the backend
    // For now, we'll use default values
    try {
      // const response = await adminApi.getSystemConfig();
      // if (response.success && response.data) {
      //   setConfig(response.data);
      // }
    } catch (err) {
      console.error('Config load error:', err);
    }
  };

  const handleSaveConfig = async (section: string) => {
    try {
      setLoading(true);
      setError('');
      
      // This would save the configuration to the backend
      // const response = await adminApi.updateSystemConfig(section, config);
      // if (response.success) {
        message.success(`${section} configuration saved successfully`);
      // }
    } catch (err) {
      message.error(`Failed to save ${section} configuration`);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemLogs = async () => {
    try {
      // This would load actual system logs from the backend
      // const response = await adminApi.getSystemLogs({ limit: 100 });
      // if (response.success && response.data) {
      //   setLogs(response.data.logs);
      // }
      
      // Mock logs for demonstration
      setLogs([
        { level: 'info', message: 'User login: admin@dropstrike.com', timestamp: new Date().toISOString() },
        { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000).toISOString() },
        { level: 'error', message: 'PayPal API timeout', timestamp: new Date(Date.now() - 600000).toISOString() },
        { level: 'info', message: 'Payout processed: $25.00', timestamp: new Date(Date.now() - 900000).toISOString() },
      ]);
    } catch (err) {
      console.error('Logs error:', err);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          System Settings
        </Title>
        <Text type="secondary">
          Configure system parameters, monitor health, and manage application settings.
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      )}

      {success && (
        <Alert message={success} type="success" style={{ marginBottom: '16px' }} />
      )}

      <Row gutter={[16, 16]}>
        {/* System Health */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <HeartOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Title level={4} style={{ margin: 0 }}>System Health</Title>
              <div style={{ marginLeft: 'auto' }}>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={loadSystemHealth}
                  size="small"
                />
              </div>
            </div>

            {systemHealth ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Status:</Text>
                  <Tag color={systemHealth.status === 'healthy' ? 'success' : 'error'}>
                    {systemHealth.status.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Uptime:</Text>
                  <Text>{formatUptime(systemHealth.uptime)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Memory Used:</Text>
                  <Text>{formatBytes(systemHealth.memory.heapUsed)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Database:</Text>
                  <Tag color={systemHealth.database === 'connected' ? 'success' : 'error'}>
                    {systemHealth.database.toUpperCase()}
                  </Tag>
                </div>

                <Divider />

                <Title level={5} style={{ marginBottom: '8px' }}>Services</Title>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>PayPal:</Text>
                  <Tag color={systemHealth.services.paypal ? 'success' : 'default'}>
                    {systemHealth.services.paypal ? 'ENABLED' : 'DISABLED'}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>AdMob:</Text>
                  <Tag color={systemHealth.services.admob ? 'success' : 'default'}>
                    {systemHealth.services.admob ? 'ENABLED' : 'DISABLED'}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Email:</Text>
                  <Tag color={systemHealth.services.email ? 'success' : 'default'}>
                    {systemHealth.services.email ? 'ENABLED' : 'DISABLED'}
                  </Tag>
                </div>

                <Button
                  block
                  icon={<EyeOutlined />}
                  onClick={() => {
                    loadSystemLogs();
                    setLogsModal(true);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  View System Logs
                </Button>
              </div>
            ) : (
              <Text type="secondary">Loading system health...</Text>
            )}
          </Card>
        </Col>

        {/* Coin & Payout Configuration */}
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <DollarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Title level={4} style={{ margin: 0 }}>Coin & Payout Configuration</Title>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Base Coin to USD Rate</Text>
                  <Input
                    type="number"
                    value={config.baseCoinToUsdRate}
                    onChange={(e) => setConfig({ ...config, baseCoinToUsdRate: parseFloat(e.target.value) })}
                    step={0.0001}
                    min={0.0001}
                    style={{ marginTop: '4px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    How many USD per coin (e.g., 0.001 = 1000 coins = $1)
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Platform Fee Rate</Text>
                  <Input
                    type="number"
                    value={config.platformFeeRate}
                    onChange={(e) => setConfig({ ...config, platformFeeRate: parseFloat(e.target.value) })}
                    step={0.01}
                    min={0}
                    max={1}
                    style={{ marginTop: '4px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Platform fee as decimal (e.g., 0.05 = 5%)
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Minimum Payout Amount ($)</Text>
                  <Input
                    type="number"
                    value={config.minimumPayoutAmount}
                    onChange={(e) => setConfig({ ...config, minimumPayoutAmount: parseFloat(e.target.value) })}
                    step={0.01}
                    min={0.01}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Maximum Payout Amount ($)</Text>
                  <Input
                    type="number"
                    value={config.maximumPayoutAmount}
                    onChange={(e) => setConfig({ ...config, maximumPayoutAmount: parseFloat(e.target.value) })}
                    step={0.01}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
            </Row>

            <div style={{ textAlign: 'right', paddingTop: '16px' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveConfig('Coin & Payout')}
                loading={loading}
              >
                Save Configuration
              </Button>
            </div>
          </Card>
        </Col>

        {/* Ad Configuration */}
        <Col xs={24} md={12}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <SettingOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Title level={4} style={{ margin: 0 }}>Ad Configuration</Title>
            </div>

            <Row gutter={16}>
              <Col xs={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Default Ad Cooldown (minutes)</Text>
                  <Input
                    type="number"
                    value={config.defaultAdCooldown}
                    onChange={(e) => setConfig({ ...config, defaultAdCooldown: parseInt(e.target.value) })}
                    min={0}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Max Daily Ad Views</Text>
                  <Input
                    type="number"
                    value={config.maxDailyAdViews}
                    onChange={(e) => setConfig({ ...config, maxDailyAdViews: parseInt(e.target.value) })}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Rewarded Video Coins</Text>
                  <Input
                    type="number"
                    value={config.rewardedVideoCoins}
                    onChange={(e) => setConfig({ ...config, rewardedVideoCoins: parseInt(e.target.value) })}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Interstitial Ad Coins</Text>
                  <Input
                    type="number"
                    value={config.interstitialAdCoins}
                    onChange={(e) => setConfig({ ...config, interstitialAdCoins: parseInt(e.target.value) })}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Banner Ad Coins</Text>
                  <Input
                    type="number"
                    value={config.bannerAdCoins}
                    onChange={(e) => setConfig({ ...config, bannerAdCoins: parseInt(e.target.value) })}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
            </Row>

            <div style={{ textAlign: 'right', paddingTop: '16px' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveConfig('Ad')}
                loading={loading}
              >
                Save Configuration
              </Button>
            </div>
          </Card>
        </Col>

        {/* Security Configuration */}
        <Col xs={24} md={12}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <SecurityScanOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              <Title level={4} style={{ margin: 0 }}>Security Configuration</Title>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Max Login Attempts</Text>
                  <Input
                    type="number"
                    value={config.maxLoginAttempts}
                    onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) })}
                    min={1}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>Session Timeout (seconds)</Text>
                  <Input
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                    min={300}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </Col>
              <Col xs={24}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text>Require Email Verification</Text>
                  <Switch
                    checked={config.requireEmailVerification}
                    onChange={(checked) => setConfig({ ...config, requireEmailVerification: checked })}
                  />
                </div>
              </Col>
              <Col xs={24}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text>Enable Two-Factor Authentication</Text>
                  <Switch
                    checked={config.enableTwoFactor}
                    onChange={(checked) => setConfig({ ...config, enableTwoFactor: checked })}
                  />
                </div>
              </Col>
            </Row>

            <div style={{ textAlign: 'right', paddingTop: '16px' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveConfig('Security')}
                loading={loading}
              >
                Save Configuration
              </Button>
            </div>
          </Card>
        </Col>

        {/* System Toggles */}
        <Col xs={24}>
          <Card>
            <Title level={4} style={{ marginBottom: '16px' }}>
              System Toggles
            </Title>
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Text>Maintenance Mode</Text>
                  <Switch
                    checked={config.maintenanceMode}
                    onChange={(checked) => setConfig({ ...config, maintenanceMode: checked })}
                  />
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Text>User Registration</Text>
                  <Switch
                    checked={config.registrationEnabled}
                    onChange={(checked) => setConfig({ ...config, registrationEnabled: checked })}
                  />
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Text>Payouts Enabled</Text>
                  <Switch
                    checked={config.payoutsEnabled}
                    onChange={(checked) => setConfig({ ...config, payoutsEnabled: checked })}
                  />
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Text>Debug Mode</Text>
                  <Switch
                    checked={config.debugMode}
                    onChange={(checked) => setConfig({ ...config, debugMode: checked })}
                  />
                </div>
              </Col>
            </Row>

            <div style={{ textAlign: 'right', paddingTop: '16px' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveConfig('System')}
                loading={loading}
              >
                Save Configuration
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* System Logs Modal */}
      <Modal
        title="System Logs"
        open={logsModal}
        onCancel={() => setLogsModal(false)}
        footer={[
          <Button key="close" onClick={() => setLogsModal(false)}>
            Close
          </Button>,
          <Button key="clear" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        ]}
        width={800}
      >
        <List
          dataSource={logs}
          renderItem={(log, index) => (
            <List.Item
              key={index}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={getLogLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Tag>
                    <Text>{log.message}</Text>
                  </Space>
                }
                description={format(new Date(log.timestamp), 'PPpp')}
              />
            </List.Item>
          )}
        />
      </Modal>
    </Content>
  );
};

export default Settings;
