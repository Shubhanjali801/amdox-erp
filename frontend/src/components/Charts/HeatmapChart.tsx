import React from 'react';
import { ResponsiveContainer } from 'recharts';
interface Props { data?: any[]; title?: string; }
const HeatmapChart: React.FC<Props> = ({ title = 'Heatmap Chart' }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
    <h3 className="text-white font-semibold mb-3">{title}</h3>
    <ResponsiveContainer width="100%" height={200}>
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">Heatmap chart — M6 implements</div>
    </ResponsiveContainer>
  </div>
);
export default HeatmapChart;
