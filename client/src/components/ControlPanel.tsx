import { Play, Pause, Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ControlPanelProps {
  onPlayPause?: (isRunning: boolean) => void;
  onSettings?: () => void;
  onReset?: () => void;
}

export default function ControlPanel({ onPlayPause, onSettings, onReset }: ControlPanelProps) {
  const [isRunning, setIsRunning] = useState(true);

  const handlePlayPause = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    onPlayPause?.(newState);
    console.log(`Prediction engine ${newState ? 'started' : 'paused'}`);
  };

  const handleSettings = () => {
    onSettings?.();
    console.log('Settings clicked');
  };

  const handleReset = () => {
    onReset?.();
    console.log('Model reset clicked');
  };

  return (
    <div className="flex items-center gap-2" data-testid="control-panel">
      <Button
        size="icon"
        variant={isRunning ? "default" : "outline"}
        onClick={handlePlayPause}
        data-testid={isRunning ? "button-pause" : "button-play"}
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        onClick={handleReset}
        data-testid="button-reset"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSettings}
        data-testid="button-settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
