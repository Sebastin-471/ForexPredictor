import SignalHistory from '../SignalHistory';

export default function SignalHistoryExample() {
  const mockSignals = [
    { id: "1", timestamp: "14:32:45", direction: "UP" as const, probability: 0.73, result: "correct" as const, actualMove: 0.00012 },
    { id: "2", timestamp: "14:31:45", direction: "DOWN" as const, probability: 0.68, result: "correct" as const, actualMove: -0.00008 },
    { id: "3", timestamp: "14:30:45", direction: "UP" as const, probability: 0.61, result: "incorrect" as const, actualMove: -0.00003 },
    { id: "4", timestamp: "14:29:45", direction: "DOWN" as const, probability: 0.75, result: "correct" as const, actualMove: -0.00015 },
    { id: "5", timestamp: "14:28:45", direction: "UP" as const, probability: 0.58, result: "incorrect" as const, actualMove: -0.00005 },
  ];

  return <SignalHistory signals={mockSignals} maxHeight="300px" />;
}
