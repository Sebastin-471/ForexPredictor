import ConnectionStatus from '../ConnectionStatus';

export default function ConnectionStatusExample() {
  return (
    <div className="space-y-4">
      <ConnectionStatus isConnected={true} latency={45} lastUpdate="2s ago" />
      <ConnectionStatus isConnected={false} />
    </div>
  );
}
