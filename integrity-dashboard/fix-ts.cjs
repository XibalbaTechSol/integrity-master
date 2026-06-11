const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/TabNav.tsx',
  'src/components/shared/MetricCard.tsx',
  'src/components/shared/Panel.tsx',
  'src/components/shared/StatusBadge.tsx',
  'src/components/shared/Toast.tsx',
  'src/components/tabs/AdvancedPanel.tsx',
  'src/components/tabs/CompliancePanel.tsx',
  'src/components/tabs/CreditPanel.tsx',
  'src/components/tabs/GovernancePanel.tsx',
  'src/components/tabs/IdentityPanel.tsx',
  'src/components/tabs/LedgerPanel.tsx',
  'src/components/tabs/MarketsPanel.tsx',
  'src/components/tabs/TelemetryPanel.tsx',
  'src/components/tabs/ZKProverPanel.tsx',
  'src/components/tabs/FactoryPanel.tsx',
  'src/services/api.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix React imports
  content = content.replace(/import React from 'react';\n/g, '');
  content = content.replace(/import React, \{ (.*?) \} from 'react';\n/g, 'import { $1 } from \'react\';\n');
  
  // Fix specific unused vars
  if (file.includes('TabNav.tsx')) {
    content = content.replace("import { TabId }", "import type { TabId }");
  }
  if (file.includes('MetricCard.tsx') || file.includes('Panel.tsx')) {
    content = content.replace("import { ReactNode } from 'react'", "import type { ReactNode } from 'react'");
  }
  if (file.includes('StatusBadge.tsx')) {
    content = content.replace(/, type = 'info'/g, '');
  }
  if (file.includes('AdvancedPanel.tsx')) {
    content = content.replace(/, LineChart/g, '');
  }
  if (file.includes('CreditPanel.tsx')) {
    content = content.replace(/, AlertTriangle, CheckCircle/g, '');
    content = content.replace(/import { Loan } from '\.\.\/\.\.\/types';\n/g, '');
  }
  if (file.includes('GovernancePanel.tsx')) {
    content = content.replace(/import { StatusBadge } from '\.\.\/shared\/StatusBadge';\n/g, '');
  }
  if (file.includes('IdentityPanel.tsx')) {
    content = content.replace(/, Database/g, '');
    content = content.replace("import { DIDDocument }", "import type { DIDDocument }");
  }
  if (file.includes('LedgerPanel.tsx')) {
    content = content.replace("import { OwnedContract }", "import type { OwnedContract }");
  }
  if (file.includes('MarketsPanel.tsx')) {
    content = content.replace(/, addToast/g, '');
  }
  if (file.includes('api.ts')) {
    content = content.replace(/, Loan, GovernanceProposal/g, '');
    content = content.replace(/  MarketplaceOffer, ReputationPoint, ZKProof, ComplianceScore,\n/g, '  ReputationPoint,\n');
    content = content.replace(/  ComplianceEvent, ProvenanceEntry, EquityHolding, DIDDocument\n/g, '  DIDDocument\n');
  }

  fs.writeFileSync(file, content);
}
console.log('Fixed files');
