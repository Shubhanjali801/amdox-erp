import React from 'react';
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props { data?: { name: string; value: number }[]; title?: string; }

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PieChart: React.FC<Props> = ({ data = [], title = 'Pie Chart' }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
    <h3 className="text-white font-semibold mb-3">{title}</h3>
    {data.length === 0 ? (
      <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No data</div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <RPieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </RPieChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default PieChart;
