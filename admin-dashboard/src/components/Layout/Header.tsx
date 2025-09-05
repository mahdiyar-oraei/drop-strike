import React from 'react';
import {
  Layout,
  Typography,
  Button,
  Space,
  Tag,
  Avatar,
  Dropdown,
  Menu,
} from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

interface HeaderProps {
  onCollapse: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCollapse }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onCollapse}
          style={{ marginRight: '16px' }}
        />
        <Title level={4} style={{ margin: 0 }}>
          Drop Strike Admin Dashboard
        </Title>
      </div>
      
      <Space size="middle">
        <Tag color="blue" style={{ margin: 0 }}>
          Admin
        </Tag>
        
        <Button type="text" icon={<BellOutlined />} />
        
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>{user?.email}</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
