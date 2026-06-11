import { TokenWallet } from '../legacy-ui/TokenWallet';

export function WalletPanel() {
  return (
    <div className="flex-col gap-6">
      <TokenWallet />
    </div>
  );
}
