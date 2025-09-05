import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface AnalyticsChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'pie';
  title?: string;
  xKey?: string;
  yKey?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  type,
  title,
  xKey = 'name',
  yKey = 'value',
  color,
  height = 300,
  showLegend = true,
}) => {
  const theme = useTheme();
  const primaryColor = color || theme.palette.primary.main;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={primaryColor} 
                strokeWidth={2}
                dot={{ fill: primaryColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: primaryColor, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              <Bar 
                dataKey={yKey} 
                fill={primaryColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey={yKey} 
                stroke={primaryColor} 
                fill={primaryColor}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent || 0 * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        <Box sx={{ width: '100%', height: height }}>
          {renderChart()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
