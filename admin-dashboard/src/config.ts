export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  appName: process.env.REACT_APP_NAME || 'Drop Strike Admin Dashboard',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.REACT_APP_ENV || 'development',
};
