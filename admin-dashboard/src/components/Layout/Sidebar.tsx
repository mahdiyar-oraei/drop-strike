import React from 'react';
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Space,
  Button,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  WalletOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/payouts', icon: <WalletOutlined />, label: 'Payouts' },
  { key: '/ads', icon: <VideoCameraOutlined />, label: 'Ad Rewards' },
  { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          {collapsed ? 'DS' : 'Drop Strike Admin'}
        </Title>
      </div>

      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Welcome back,
          </Text>
          <Text strong style={{ fontSize: '14px' }}>
            {user?.name || user?.email}
          </Text>
        </Space>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          background: 'transparent',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
        }}
      >
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          style={{
            textAlign: 'left',
            height: '40px',
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </Sider>
  );
};

export default Sidebar;
