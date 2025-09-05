import React, { useState } from 'react';
import {
  Layout,
  Card,
  Input,
  Button,
  Typography,
  Alert,
  Spin,
  Form,
} from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials or insufficient permissions');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Content
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '24px',
        }}
      >
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                color: '#1890ff',
              }}
            >
              <PlayCircleOutlined style={{ fontSize: '40px', marginRight: '8px' }} />
              <Title level={2} style={{ margin: 0, fontWeight: 'bold' }}>
                Drop Strike
              </Title>
            </div>

            <Title level={3} style={{ marginBottom: '24px', color: '#666' }}>
              Admin Dashboard
            </Title>

            {error && (
              <Alert message={error} type="error" style={{ width: '100%', marginBottom: '16px' }} />
            )}

            <Form
              onFinish={handleSubmit}
              style={{ width: '100%' }}
              layout="vertical"
            >
              <Form.Item
                label="Email Address"
                name="email"
                rules={[{ required: true, message: 'Please input your email!' }]}
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    border: 'none',
                  }}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                Default Admin Credentials:
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                Email: admin@dropstrike.com
              </Text>
              <Text type="secondary" style={{ display: 'block' }}>
                Password: admin123
              </Text>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default Login;
