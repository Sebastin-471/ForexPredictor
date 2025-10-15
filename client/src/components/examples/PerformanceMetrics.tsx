import PerformanceMetrics from '../PerformanceMetrics';

export default function PerformanceMetricsExample() {
  return (
    <PerformanceMetrics 
      successRate={0.673}
      precision={0.71}
      recall={0.68}
      totalSignals={1247}
    />
  );
}
