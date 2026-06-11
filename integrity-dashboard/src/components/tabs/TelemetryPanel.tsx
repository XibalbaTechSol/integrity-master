import { Panel } from '../shared/Panel';
import { Activity, Cpu } from 'lucide-react';
import { TelemetryStream } from '../legacy-ui/TelemetryStream';
import { AISEquationAnimation } from '../legacy-ui/AISEquationAnimation';

export function TelemetryPanel() {
  return (
    <div className="flex-col gap-6">
      <Panel title="Real-Time Network Telemetry" icon={<Activity size={18} />}>
        <TelemetryStream />
      </Panel>
      
      <Panel title="AIS Cryptographic Math" icon={<Cpu size={18} />}>
        <AISEquationAnimation />
      </Panel>
    </div>
  );
}
