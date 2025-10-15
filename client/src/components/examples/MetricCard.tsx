import MetricCard from '../MetricCard';
import { Activity } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard 
        title="Accuracy" 
        value="67.3%" 
        subtitle="Last 24 hours"
        icon={Activity}
        trend={{ value: 2.4, isPositive: true }}
      />
      <MetricCard 
        title="Total Signals" 
        value="1,247" 
        subtitle="This session"
        trend={{ value: -0.8, isPositive: false }}
      />
      <MetricCard 
        title="Avg Confidence" 
        value="71.2%" 
        subtitle="Current model"
      />
    </div>
  );
}
