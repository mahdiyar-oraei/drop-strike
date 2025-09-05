import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Input,
  Button,
  Select,
  Tag,
  Alert,
  Modal,
  Form,
  Switch,
  Tabs,
  Row,
  Col,
  Space,
  Tooltip,
  Table,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BarChartOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  BorderOutlined,
} from '@ant-design/icons';
import { AdReward } from '../types';
import { adApi } from '../services/api';
import { format } from 'date-fns';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Ads: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [adRewards, setAdRewards] = useState<AdReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adTypeFilter, setAdTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; adReward: AdReward | null }>({
    open: false,
    adReward: null,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('monthly');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadAdRewards();
  }, [pagination.current, pagination.pageSize, adTypeFilter, isActiveFilter]);

  useEffect(() => {
    if (tabValue === 1) {
      loadAnalytics();
    }
  }, [tabValue, analyticsTimeframe]);

  const loadAdRewards = async () => {
    try {
      setLoading(true);
      const response = await adApi.getAdRewards({
        page: pagination.current,
        limit: pagination.pageSize,
        adType: adTypeFilter || undefined,
        isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
      });

      if (response.success && response.data) {
        setAdRewards(response.data.adRewards);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalRewards,
        }));
      } else {
        setError('Failed to load ad rewards');
      }
    } catch (err) {
      setError('An error occurred while loading ad rewards');
      console.error('Ad rewards error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await adApi.getAdAnalytics(analyticsTimeframe);
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Analytics error:', err);
    }
  };

  const handleCreateAdReward = async (values: any) => {
    try {
      const response = await adApi.createAdReward(values as Partial<AdReward>);
      if (response.success) {
        message.success('Ad reward created successfully');
        setCreateModal(false);
        form.resetFields();
        loadAdRewards();
      } else {
        message.error('Failed to create ad reward');
      }
    } catch (err) {
      message.error('An error occurred while creating ad reward');
      console.error('Create ad reward error:', err);
    }
  };

  const handleUpdateAdReward = async (values: any) => {
    if (!editModal.adReward) return;

    try {
      const response = await adApi.updateAdReward(editModal.adReward._id, values as Partial<AdReward>);
      if (response.success) {
        message.success('Ad reward updated successfully');
        setEditModal({ open: false, adReward: null });
        form.resetFields();
        loadAdRewards();
      } else {
        message.error('Failed to update ad reward');
      }
    } catch (err) {
      message.error('An error occurred while updating ad reward');
      console.error('Update ad reward error:', err);
    }
  };

  const openEditModal = (adReward: AdReward) => {
    form.setFieldsValue({
      adType: adReward.adType,
      adUnitId: adReward.adUnitId,
      adUnitName: adReward.adUnitName,
      coinReward: adReward.coinReward,
      description: adReward.description || '',
      minimumWatchTime: adReward.minimumWatchTime || 30,
      dailyLimit: adReward.dailyLimit || 10,
      isActive: adReward.isActive,
      minLevel: adReward.requirements?.minLevel || 0,
      cooldownMinutes: adReward.requirements?.cooldownMinutes || 5,
    });
    setEditModal({ open: true, adReward });
  };

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'rewarded_video': return <VideoCameraOutlined />;
      case 'interstitial': return <AppstoreOutlined />;
      case 'banner': return <BorderOutlined />;
      default: return <EyeOutlined />;
    }
  };

  const getAdTypeColor = (adType: string) => {
    switch (adType) {
      case 'rewarded_video': return 'blue';
      case 'interstitial': return 'purple';
      case 'banner': return 'cyan';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Ad Unit',
      dataIndex: 'adUnitName',
      key: 'adUnitName',
      width: 200,
      render: (text: string, record: AdReward) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
            {record.adUnitId}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'adType',
      key: 'adType',
      width: 140,
      render: (adType: string) => (
        <Tag icon={getAdTypeIcon(adType)} color={getAdTypeColor(adType)}>
          {adType.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reward',
      dataIndex: 'coinReward',
      key: 'coinReward',
      width: 100,
      render: (value: number) => (
        <Text strong>{value} coins</Text>
      ),
    },
    {
      title: 'Daily Limit',
      dataIndex: 'dailyLimit',
      key: 'dailyLimit',
      width: 110,
      render: (value: number) => value || 'Unlimited',
    },
    {
      title: 'Watch Time',
      dataIndex: 'minimumWatchTime',
      key: 'minimumWatchTime',
      width: 120,
      render: (value: number) => `${value}s`,
    },
    {
      title: 'Cooldown',
      key: 'cooldown',
      width: 100,
      render: (record: AdReward) => `${record.requirements?.cooldownMinutes || 0}m`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: AdReward) => (
        <Space>
          <Tooltip title="Edit Ad Unit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="View Analytics">
            <Button
              type="text"
              icon={<BarChartOutlined />}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Ad Rewards Management
        </Title>
        <Text type="secondary">
          Configure and monitor different ad reward types and their performance.
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      )}

      <Tabs activeKey={tabValue.toString()} onChange={(key) => setTabValue(parseInt(key))}>
        <TabPane tab="Ad Rewards Configuration" key="0">

          {/* Filters and Actions */}
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={16} align="middle">
              <Col xs={24} md={6}>
                <Select
                  placeholder="Ad Type"
                  value={adTypeFilter}
                  onChange={setAdTypeFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">All Types</Option>
                  <Option value="rewarded_video">Rewarded Video</Option>
                  <Option value="interstitial">Interstitial</Option>
                  <Option value="banner">Banner</Option>
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Status"
                  value={isActiveFilter}
                  onChange={setIsActiveFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">All</Option>
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModal(true)}
                  >
                    Add Ad Unit
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Ad Rewards Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={adRewards}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                pageSizeOptions: ['10', '25', '50', '100'],
                onChange: (page, pageSize) => {
                  setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || prev.pageSize,
                  }));
                },
              }}
              rowKey="_id"
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Analytics" key="1">
          {/* Analytics */}
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col xs={24} md={6}>
              <Select
                placeholder="Timeframe"
                value={analyticsTimeframe}
                onChange={setAnalyticsTimeframe}
                style={{ width: '100%' }}
              >
                <Option value="daily">Today</Option>
                <Option value="weekly">This Week</Option>
                <Option value="monthly">This Month</Option>
              </Select>
            </Col>
          </Row>

          {analytics && (
            <Row gutter={16}>
              {/* Overall Stats */}
              {analytics.overallStats?.map((stat: any, index: number) => (
                <Col key={index} xs={24} md={8}>
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      {getAdTypeIcon(stat.adType)}
                      <Title level={4} style={{ margin: '0 0 0 8px' }}>
                        {stat.adType.replace('_', ' ').toUpperCase()}
                      </Title>
                    </div>
                    <Title level={2} style={{ marginBottom: '8px' }}>
                      {stat.totalViews.toLocaleString()}
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                      Total Views
                    </Text>
                    <Text style={{ display: 'block' }}>
                      {stat.totalCoinsDistributed.toLocaleString()} coins distributed
                    </Text>
                    <Text style={{ display: 'block' }}>
                      {stat.uniqueUserCount} unique users
                    </Text>
                  </Card>
                </Col>
              ))}

              {/* Top Performing Ad Units */}
              <Col xs={24}>
                <Card>
                  <Title level={4} style={{ marginBottom: '16px' }}>
                    Top Performing Ad Units
                  </Title>
                  {analytics.topAdUnits?.length > 0 ? (
                    <div>
                      {analytics.topAdUnits.map((unit: any, index: number) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '8px 0',
                          borderBottom: index < analytics.topAdUnits.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>
                          <div>
                            <Text strong style={{ display: 'block' }}>
                              {unit.adUnitName || unit.adUnitId}
                            </Text>
                            <Text type="secondary">
                              {unit.adType?.replace('_', ' ').toUpperCase()}
                            </Text>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Text strong style={{ display: 'block' }}>
                              {unit.totalViews.toLocaleString()} views
                            </Text>
                            <Text type="secondary">
                              {unit.totalCoinsDistributed.toLocaleString()} coins
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">
                      No data available for the selected timeframe.
                    </Text>
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </TabPane>
      </Tabs>

      {/* Create/Edit Modal */}
      <Modal
        title={createModal ? 'Create New Ad Unit' : 'Edit Ad Unit'}
        open={createModal || editModal.open}
        onCancel={() => {
          setCreateModal(false);
          setEditModal({ open: false, adReward: null });
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createModal ? handleCreateAdReward : handleUpdateAdReward}
          initialValues={{
            adType: 'rewarded_video',
            coinReward: 10,
            minimumWatchTime: 30,
            dailyLimit: 10,
            isActive: true,
            minLevel: 0,
            cooldownMinutes: 5,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="adType"
                label="Ad Type"
                rules={[{ required: true, message: 'Please select ad type' }]}
              >
                <Select disabled={!!editModal.adReward}>
                  <Option value="rewarded_video">Rewarded Video</Option>
                  <Option value="interstitial">Interstitial</Option>
                  <Option value="banner">Banner</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="adUnitId"
                label="Ad Unit ID"
                rules={[{ required: true, message: 'Please enter ad unit ID' }]}
              >
                <Input disabled={!!editModal.adReward} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="adUnitName"
                label="Ad Unit Name"
                rules={[{ required: true, message: 'Please enter ad unit name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="coinReward"
                label="Coin Reward"
                rules={[{ required: true, message: 'Please enter coin reward' }]}
              >
                <Input type="number" min={1} max={10000} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="minimumWatchTime" label="Minimum Watch Time (seconds)">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dailyLimit" label="Daily Limit (0 = unlimited)">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="minLevel" label="Minimum Level Required">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="cooldownMinutes" label="Cooldown (minutes)">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="isActive" valuePropName="checked">
                <Switch /> Active
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Space>
              <Button onClick={() => {
                setCreateModal(false);
                setEditModal({ open: false, adReward: null });
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {createModal ? 'Create' : 'Update'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Content>
  );
};

export default Ads;
