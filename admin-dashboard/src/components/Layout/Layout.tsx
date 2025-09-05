import React, { useState } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={handleCollapse} />
      <AntLayout>
        <Header onCollapse={handleCollapse} />
        <Content
          style={{
            margin: '16px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 32px)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
