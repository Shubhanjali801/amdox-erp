import React from 'react';
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { data?: { name: string; value: number }[]; title?: string; color?: string; }

const BarChart: React.FC<Props> = ({ data = [], title = 'Bar Chart', color = '#3b82f6' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
    <h3 className="text-gray-900 dark:text-white font-semibold mb-3">{title}</h3>
    {data.length === 0 ? (
      <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No data</div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <RBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </RBarChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default BarChart;
