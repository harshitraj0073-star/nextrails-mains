import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

interface DistressChartProps {
  data: { date: string; score: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    let status = "Low";
    if (score > 80) status = "Urgent";
    else if (score > 60) status = "High";
    else if (score > 40) status = "Moderate";
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="font-semibold text-slate-800">
          Score: <span className="text-primary">{score}</span>
        </p>
        <p className="text-xs mt-1 text-slate-600">Indicator: {status}</p>
      </div>
    );
  }
  return null;
};

export const DistressChart: React.FC<DistressChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    name: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    score: d.score
  })).reverse(); // Oldest first for chronological order on X axis

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#1e40af" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
