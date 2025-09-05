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
  Row,
  Col,
  Space,
  Table,
  message,
} from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { User } from '../types';
import { userApi } from '../services/api';
import { format } from 'date-fns';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [coinAdjustment, setCoinAdjustment] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, searchTerm, countryFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
        country: countryFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
        sortBy: 'totalCoinsEarned',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalUsers,
        }));
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('An error occurred while loading users');
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (values: any) => {
    if (!bulkAction || selectedRowKeys.length === 0) return;

    try {
      const actionData: any = { reason: values.actionReason || actionReason };
      if (bulkAction === 'adjust-coins') {
        actionData.coinAdjustment = parseInt(values.coinAdjustment || coinAdjustment);
      }

      const response = await userApi.bulkUserAction(
        bulkAction,
        selectedRowKeys.map(id => String(id)),
        actionData
      );

      if (response.success) {
        message.success('Bulk action completed successfully');
        setBulkActionModal(false);
        setSelectedRowKeys([]);
        setBulkAction('');
        setCoinAdjustment('');
        setActionReason('');
        form.resetFields();
        loadUsers();
      } else {
        message.error('Failed to perform bulk action');
      }
    } catch (err) {
      message.error('An error occurred during bulk action');
      console.error('Bulk action error:', err);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: User) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 100,
      render: (country: string) => <Tag>{country}</Tag>,
    },
    {
      title: 'Coins',
      dataIndex: 'coins',
      key: 'coins',
      width: 120,
      render: (value: number) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold' }}>{value.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ${(value * 0.001).toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: 'Total Earned',
      dataIndex: 'totalCoinsEarned',
      key: 'totalCoinsEarned',
      width: 130,
      render: (value: number) => <Text strong>{value.toLocaleString()}</Text>,
    },
    {
      title: 'Play Time',
      dataIndex: 'totalEngagementTime',
      key: 'totalEngagementTime',
      width: 120,
      render: (value: number) => {
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return `${hours}h ${minutes}m`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 120,
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy'),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 120,
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy'),
    },
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          User Management
        </Title>
        <Text type="secondary">
          Manage and monitor all registered users in your game.
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      )}

      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Country"
              value={countryFilter}
              onChange={setCountryFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="">All Countries</Option>
              <Option value="US">United States</Option>
              <Option value="CA">Canada</Option>
              <Option value="GB">United Kingdom</Option>
              <Option value="DE">Germany</Option>
              <Option value="FR">France</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="">All Users</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} md={10}>
            <Space>
              <Button
                disabled={selectedRowKeys.length === 0}
                onClick={() => setBulkActionModal(true)}
              >
                Bulk Actions ({selectedRowKeys.length} selected)
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {/* Handle add user */}}
              >
                Add User
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
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
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Bulk Action Modal */}
      <Modal
        title="Bulk Actions"
        open={bulkActionModal}
        onCancel={() => setBulkActionModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBulkAction}
        >
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please select an action' }]}
          >
            <Select
              placeholder="Select action"
              value={bulkAction}
              onChange={setBulkAction}
            >
              <Option value="activate">Activate Users</Option>
              <Option value="deactivate">Deactivate Users</Option>
              <Option value="adjust-coins">Adjust Coins</Option>
            </Select>
          </Form.Item>

          {bulkAction === 'adjust-coins' && (
            <Form.Item
              name="coinAdjustment"
              label="Coin Adjustment"
              rules={[{ required: true, message: 'Please enter coin adjustment' }]}
            >
              <Input
                type="number"
                placeholder="Enter coin adjustment"
                value={coinAdjustment}
                onChange={(e) => setCoinAdjustment(e.target.value)}
              />
            </Form.Item>
          )}

          <Form.Item name="actionReason" label="Reason (Optional)">
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Space>
              <Button onClick={() => setBulkActionModal(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!bulkAction}
              >
                Apply Action
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Content>
  );
};

export default Users;
