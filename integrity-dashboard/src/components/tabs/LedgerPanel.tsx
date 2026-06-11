import { Panel } from '../shared/Panel';
import { Activity, Layers } from 'lucide-react';
import { BlockchainVisualizer } from '../legacy-ui/BlockchainVisualizer';
import { ImmutableLedger } from '../legacy-ui/ImmutableLedger';

export function LedgerPanel() {
  return (
    <div className="flex-col gap-6">
      <Panel title="Global Network State" icon={<Activity size={18} />}>
        <BlockchainVisualizer />
      </Panel>

      <Panel title="Immutable Settlement Ledger" icon={<Layers size={18} />}>
        <ImmutableLedger />
      </Panel>
    </div>
  );
}
