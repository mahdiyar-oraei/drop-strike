import React from 'react';
import {
  Line,
  Column,
  Pie,
  Area,
} from '@ant-design/charts';
import { Card, Typography } from 'antd';

const { Title } = Typography;

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

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  type,
  title,
  xKey = 'date',
  yKey = 'value',
  color = '#1890ff',
  height = 300,
  showLegend = true,
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      height,
      autoFit: true,
    };

    switch (type) {
      case 'line':
        return (
          <Line
            {...commonProps}
            xField={xKey}
            yField={yKey}
            legend={showLegend ? { position: 'top' } : false}
            tooltip={{
              shared: true,
              showCrosshairs: true,
            }}
            color={color}
          />
        );

      case 'bar':
        return (
          <Column
            {...commonProps}
            xField={xKey}
            yField={yKey}
            legend={showLegend ? { position: 'top' } : false}
            tooltip={{
              shared: true,
            }}
            color={color}
          />
        );

      case 'area':
        return (
          <Area
            {...commonProps}
            xField={xKey}
            yField={yKey}
            legend={showLegend ? { position: 'top' } : false}
            tooltip={{
              shared: true,
            }}
          />
        );

      case 'pie':
        return (
          <Pie
            {...commonProps}
            angleField={yKey}
            colorField="name"
            radius={0.8}
            label={{
              type: 'outer',
              content: '{name} {percentage}',
            }}
            legend={showLegend ? { position: 'bottom' } : false}
            tooltip={{
              formatter: (datum: any) => {
                return { name: datum.name, value: `${(datum.percent * 100).toFixed(0)}%` };
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      {title && (
        <Title level={4} style={{ marginBottom: '16px' }}>
          {title}
        </Title>
      )}
      <div style={{ width: '100%', height: height }}>
        {renderChart()}
      </div>
    </Card>
  );
};

export default AnalyticsChart;