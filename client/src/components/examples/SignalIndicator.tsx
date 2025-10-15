import SignalIndicator from '../SignalIndicator';

export default function SignalIndicatorExample() {
  return (
    <SignalIndicator 
      direction="UP" 
      probability={0.73} 
      timestamp="2s ago"
    />
  );
}
