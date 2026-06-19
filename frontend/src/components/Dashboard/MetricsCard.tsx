import React from 'react';

interface Props {
  label: string;
  value: string | number;
  icon?: string;
  hint?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet';
}

const accents: Record<string, string> = {
  blue:   'text-blue-400',
  green:  'text-green-400',
  amber:  'text-amber-400',
  red:    'text-red-400',
  violet: 'text-violet-400',
};

const MetricsCard: React.FC<Props> = ({ label, value, icon, hint, accent = 'blue' }) => (
  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      {icon && <span className="text-xl">{icon}</span>}
    </div>
    <div className={`mt-2 text-2xl font-bold ${accents[accent]}`}>{value}</div>
    {hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
  </div>
);

export default MetricsCard;
