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
  Row,
  Col,
  Space,
  Table,
  Tooltip,
  Spin,
  Statistic,
  message,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DollarOutlined,
  RiseOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Payout } from '../types';
import { payoutApi } from '../services/api';
import { format } from 'date-fns';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Payouts: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'process' | 'reject' | null;
    payout: Payout | null;
  }>({ open: false, type: null, payout: null });
  const [actionReason, setActionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  useEffect(() => {
    loadPayouts();
  }, [pagination.current, pagination.pageSize, searchTerm, statusFilter, startDate, endDate]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await payoutApi.getPayouts({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.success && response.data) {
        setPayouts(response.data.payouts);
        setStats(response.data.stats);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalPayouts,
        }));
      } else {
        setError('Failed to load payouts');
      }
    } catch (err) {
      setError('An error occurred while loading payouts');
      console.error('Payouts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!actionModal.payout) return;

    try {
      const response = await payoutApi.processPayout(
        actionModal.payout._id,
        adminNotes
      );

      if (response.success) {
        message.success('Payout processed successfully');
        setActionModal({ open: false, type: null, payout: null });
        setAdminNotes('');
        loadPayouts();
      } else {
        message.error('Failed to process payout');
      }
    } catch (err) {
      message.error('An error occurred while processing payout');
      console.error('Process payout error:', err);
    }
  };

  const handleRejectPayout = async () => {
    if (!actionModal.payout || !actionReason) return;

    try {
      const response = await payoutApi.rejectPayout(
        actionModal.payout._id,
        actionReason
      );

      if (response.success) {
        message.success('Payout rejected successfully');
        setActionModal({ open: false, type: null, payout: null });
        setActionReason('');
        loadPayouts();
      } else {
        message.error('Failed to reject payout');
      }
    } catch (err) {
      message.error('An error occurred while rejecting payout');
      console.error('Reject payout error:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 180,
      render: (text: any, record: Payout) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.userId?.name || 'Unknown User'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.userId?.email || 'No email'}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number, record: Payout) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold' }}>${value.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.coinsDeducted.toLocaleString()} coins</div>
        </div>
      ),
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>${value.toFixed(2)}</Text>
      ),
    },
    {
      title: 'PayPal Email',
      dataIndex: 'paypalEmail',
      key: 'paypalEmail',
      width: 200,
      render: (value: string) => (
        <Text code>{value}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: Payout) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => setSelectedPayout(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Process Payout">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => setActionModal({
                    open: true,
                    type: 'process',
                    payout: record
                  })}
                />
              </Tooltip>
              <Tooltip title="Reject Payout">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#ff4d4f' }}
                  onClick={() => setActionModal({
                    open: true,
                    type: 'reject',
                    payout: record
                  })}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Payout Management
        </Title>
        <Text type="secondary">
          Review, process, and manage all payout requests from users.
        </Text>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: '16px' }} />
      )}

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ClockCircleOutlined style={{ color: '#faad14', marginRight: '8px', fontSize: '20px' }} />
                <div>
                  <Statistic
                    title="Pending Payouts"
                    value={stats.pendingCount || 0}
                    valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DollarOutlined style={{ color: '#52c41a', marginRight: '8px', fontSize: '20px' }} />
                <div>
                  <Statistic
                    title="Total Paid Out"
                    value={stats.totalAmount || 0}
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
                <UserOutlined style={{ color: '#13c2c2', marginRight: '8px', fontSize: '20px' }} />
                <div>
                  <Statistic
                    title="Users Paid"
                    value={stats.uniqueUsers || 0}
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
                    title="Success Rate"
                    value={((stats.completedCount / (stats.totalCount || 1)) * 100).toFixed(1)}
                    suffix="%"
                    valueStyle={{ fontSize: '18px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder="Search by user or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="processing">Processing</Option>
              <Option value="completed">Completed</Option>
              <Option value="failed">Failed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Col>
          <Col xs={24} md={4}>
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Payouts Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={payouts}
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

      {/* Payout Details Modal */}
      <Modal
        title="Payout Details"
        open={!!selectedPayout}
        onCancel={() => setSelectedPayout(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedPayout(null)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedPayout && (
          <div>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Title level={5}>User Information</Title>
                <div style={{ marginBottom: '8px' }}>Name: {selectedPayout.userId?.name}</div>
                <div style={{ marginBottom: '8px' }}>Email: {selectedPayout.userId?.email}</div>
                <div style={{ marginBottom: '8px' }}>Country: {selectedPayout.userId?.country}</div>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5}>Payout Information</Title>
                <div style={{ marginBottom: '8px' }}>Amount: ${selectedPayout.amount.toFixed(2)}</div>
                <div style={{ marginBottom: '8px' }}>Net Amount: ${selectedPayout.netAmount.toFixed(2)}</div>
                <div style={{ marginBottom: '8px' }}>Coins Deducted: {selectedPayout.coinsDeducted.toLocaleString()}</div>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5}>PayPal Information</Title>
                <div style={{ marginBottom: '8px' }}>Email: {selectedPayout.paypalEmail}</div>
                <div style={{ marginBottom: '8px' }}>Conversion Rate: {selectedPayout.conversionRate}</div>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5}>Fees</Title>
                <div style={{ marginBottom: '8px' }}>PayPal Fee: ${selectedPayout.fees?.paypalFee?.toFixed(2) || '0.00'}</div>
                <div style={{ marginBottom: '8px' }}>Platform Fee: ${selectedPayout.fees?.platformFee?.toFixed(2) || '0.00'}</div>
              </Col>
              <Col xs={24}>
                <Title level={5}>Status & Dates</Title>
                <div style={{ marginBottom: '8px' }}>
                  Status: <Tag color={getStatusColor(selectedPayout.status)}>{selectedPayout.status.toUpperCase()}</Tag>
                </div>
                <div style={{ marginBottom: '8px' }}>Requested: {format(new Date(selectedPayout.createdAt), 'PPpp')}</div>
                {selectedPayout.processedAt && (
                  <div style={{ marginBottom: '8px' }}>Processed: {format(new Date(selectedPayout.processedAt), 'PPpp')}</div>
                )}
              </Col>
              {selectedPayout.adminNotes && (
                <Col xs={24}>
                  <Title level={5}>Admin Notes</Title>
                  <div>{selectedPayout.adminNotes}</div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title={actionModal.type === 'process' ? 'Process Payout' : 'Reject Payout'}
        open={actionModal.open}
        onCancel={() => setActionModal({ open: false, type: null, payout: null })}
        footer={[
          <Button key="cancel" onClick={() => setActionModal({ open: false, type: null, payout: null })}>
            Cancel
          </Button>,
          <Button
            key="action"
            type="primary"
            danger={actionModal.type === 'reject'}
            onClick={actionModal.type === 'process' ? handleProcessPayout : handleRejectPayout}
            disabled={actionModal.type === 'reject' && !actionReason}
          >
            {actionModal.type === 'process' ? 'Process Payout' : 'Reject Payout'}
          </Button>
        ]}
        width={500}
      >
        {actionModal.payout && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              User: {actionModal.payout.userId?.name} ({actionModal.payout.userId?.email})
            </div>
            <div style={{ marginBottom: '8px' }}>
              Amount: ${actionModal.payout.amount.toFixed(2)} (Net: ${actionModal.payout.netAmount.toFixed(2)})
            </div>
          </div>
        )}
        
        {actionModal.type === 'process' ? (
          <Input.TextArea
            placeholder="Add any processing notes..."
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        ) : (
          <Input.TextArea
            placeholder="Enter reason for rejecting this payout..."
            rows={3}
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
        )}
      </Modal>
    </Content>
  );
};

export default Payouts;
