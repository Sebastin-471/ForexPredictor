import { Wifi, WifiOff, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  isConnected: boolean;
  latency?: number;
  lastUpdate?: string;
}

export default function ConnectionStatus({ isConnected, latency, lastUpdate }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-3" data-testid="connection-status">
      <div className="relative">
        {isConnected ? (
          <>
            <Wifi className="w-5 h-5 text-status-online" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-status-online"></span>
            </span>
          </>
        ) : (
          <WifiOff className="w-5 h-5 text-status-offline" />
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={isConnected ? "default" : "secondary"} className="font-mono text-xs">
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
        
        {isConnected && latency !== undefined && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span className="font-mono text-xs">{latency}ms</span>
          </div>
        )}
        
        {lastUpdate && (
          <span className="text-xs text-muted-foreground font-mono">{lastUpdate}</span>
        )}
      </div>
    </div>
  );
}
