# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: trajectory_panel.spec.ts >> TrajectoryPanel Component >> should render trajectory list and update active trajectory on click
- Location: e2e/trajectory_panel.spec.ts:41:3

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByText('Agent Thoughts')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "Xibalba" [ref=e7]
        - generic [ref=e8]: Integrity Protocol
      - button [ref=e9] [cursor=pointer]:
        - img [ref=e10]
    - generic [ref=e12]:
      - heading "Fleet Command" [level=2] [ref=e13]
      - generic [ref=e14]: Sovereign Agent Roster
    - generic [ref=e18] [cursor=pointer]:
      - generic [ref=e19]:
        - generic [ref=e22]: Hermes_Xibalba_Sovereign
        - generic [ref=e23]:
          - generic [ref=e24]: Tier AAA
          - generic [ref=e25]: Inst.
      - generic [ref=e27]: 0x67ba5d72...
    - button "Register New Agent" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
      - text: Register New Agent
  - generic [ref=e32]:
    - generic [ref=e33]:
      - generic [ref=e34]:
        - img [ref=e35]
        - generic [ref=e37]:
          - heading "Integrity Command Center" [level=1] [ref=e38]
          - generic [ref=e39]: ORACLE REPUTATION NETWORK v9.0
      - generic [ref=e40]:
        - generic [ref=e41]:
          - img [ref=e42]
          - generic [ref=e45]: "Domain:"
          - combobox [ref=e46] [cursor=pointer]:
            - option "Global (Mesh)" [selected]
            - option "Shield (Healthcare)"
            - option "Quant (Finance)"
            - option "Logistics (Supply)"
        - generic [ref=e47]:
          - img [ref=e48]
          - text: DATABASE ONLINE
        - button "Sync" [ref=e51] [cursor=pointer]:
          - img [ref=e52]
          - text: Sync
        - button "Connect Wallet" [ref=e57] [cursor=pointer]:
          - img [ref=e58]
          - text: Connect Wallet
    - button "Telemetry" [ref=e62]:
      - generic [ref=e63]:
        - img [ref=e64]
        - text: Telemetry
      - img [ref=e66]
    - main [ref=e68]:
      - generic [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]:
            - generic [ref=e74]:
              - img [ref=e76]
              - text: Real-Time Network Ingestion
            - generic [ref=e79]:
              - generic [ref=e80]: Visualizing the high-frequency telemetry stream directly from Node 5.
              - generic [ref=e81]:
                - generic [ref=e83]:
                  - img [ref=e85]
                  - generic [ref=e87]:
                    - heading "Live Telemetry" [level=2] [ref=e88]
                    - generic [ref=e89]: Ingestion In-Progress
                - generic [ref=e90]: Real-time ingestion of active node performance metrics. Latency, accuracy, and operational streams are continuously analyzed to feed the protocol's reputation engine.
                - generic [ref=e93]: "STREAM_BUFFER: 0/50"
          - generic [ref=e94]:
            - generic [ref=e95]:
              - generic [ref=e97]:
                - img [ref=e99]
                - text: Metric Decomposition
              - generic [ref=e103]:
                - generic [ref=e104]:
                  - button "entropy" [ref=e105] [cursor=pointer]
                  - button "grounding" [ref=e106] [cursor=pointer]
                  - button "sacrifice" [ref=e107] [cursor=pointer]
                  - button "compliance" [ref=e108] [cursor=pointer]
                - generic [ref=e110]:
                  - generic [ref=e111]: Entropy Score (Stability)
                  - paragraph [ref=e112]: Measures the statistical variance in agent response latency and data quality. The Oracle applies an exponential decay function to punish unpredictable behavior.
                  - generic [ref=e113]:
                    - img [ref=e114]
                    - text: "Stability Drag Active: -12% applied to current AIS."
            - generic [ref=e116]:
              - generic [ref=e118]:
                - img [ref=e120]
                - text: AIS Radar Profile
              - application [ref=e125]:
                - generic [ref=e145]:
                  - generic [ref=e147]: Stability (1-E)
                  - generic [ref=e150]: Grounding
                  - generic [ref=e153]: Sacrifice
                  - generic [ref=e156]: Identity
                  - generic [ref=e159]: Compliance
        - generic [ref=e160]:
          - generic [ref=e161]:
            - generic [ref=e163]:
              - img [ref=e165]
              - text: AIS Formula Anchor
            - generic [ref=e171]:
              - paragraph [ref=e172]: The Agent Integrity Score is an actuarial trust metric derived from multi-dimensional telemetry.
              - generic [ref=e173]:
                - generic [ref=e174]:
                  - img [ref=e175]
                  - text: Core Mathematical Engine (v8.4)
                - generic [ref=e180]: AIS = (w_E · S_E +w_G · S_G +w_S · S_S ) · Drag(σ²)
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - generic [ref=e183]: Stability Drag (e^-1.5σ²)
                    - generic [ref=e184]: "Impact: High"
                  - generic [ref=e185]:
                    - generic [ref=e186]: Grounding Boost (1 + HITL · 0.2)
                    - generic [ref=e187]: "Impact: Moderate"
              - generic [ref=e188]:
                - img [ref=e189]
                - generic [ref=e191]:
                  - strong [ref=e192]: "Oracle Note:"
                  - text: Current domain
                  - emphasis [ref=e193]: Global
                  - text: uses equal weights.
                  - emphasis [ref=e194]: Shield
                  - text: domain increases
                  - strong [ref=e195]: w_G
                  - text: to 0.40.
          - generic [ref=e196]:
            - generic [ref=e198]:
              - img [ref=e200]
              - text: Node Synchronization
            - generic [ref=e206]:
              - generic [ref=e207]:
                - generic [ref=e210]: Node 1
                - generic [ref=e211]: v9.0.2 - STABLE
              - generic [ref=e212]:
                - generic [ref=e215]: Node 2
                - generic [ref=e216]: v9.0.2 - STABLE
              - generic [ref=e217]:
                - generic [ref=e220]: Node 3
                - generic [ref=e221]: v9.0.2 - STABLE
              - generic [ref=e222]:
                - generic [ref=e225]: Node 4
                - generic [ref=e226]: v9.0.2 - STABLE
              - generic [ref=e227]:
                - generic [ref=e230]: Node 5
                - generic [ref=e231]: v9.0.2 - STABLE
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const mockTrajectories = [
  4  |   {
  5  |     id: 'traj_01',
  6  |     intent: 'Analyze and summarize patient blood test results.',
  7  |     status: 'Validating',
  8  |     score: 950,
  9  |     steps: [
  10 |       { id: 's1', type: 'thought', message: 'First thought', time: '10:02:45' }
  11 |     ]
  12 |   },
  13 |   {
  14 |     id: 'traj_02',
  15 |     intent: 'Generate medical report',
  16 |     status: 'Drift Detected',
  17 |     score: 650,
  18 |     steps: [
  19 |       { id: 's2', type: 'tool', name: 'generate_report', args: '{}', time: '10:05:00' },
  20 |       { id: 's3', type: 'alert', message: 'Drift warning', time: '10:05:01' }
  21 |     ]
  22 |   }
  23 | ];
  24 | 
  25 | test.describe('TrajectoryPanel Component', () => {
  26 |   test.beforeEach(async ({ page }) => {
  27 |     // Mock the trajectory polling endpoint
  28 |     await page.route('**/v1/trajectories/recent', async (route) => {
  29 |       await route.fulfill({
  30 |         status: 200,
  31 |         contentType: 'application/json',
  32 |         body: JSON.stringify({ trajectories: mockTrajectories }),
  33 |       });
  34 |     });
  35 | 
  36 |     // Navigate to the dashboard where the TrajectoryPanel is rendered
  37 |     await page.goto('/dashboard');
> 38 |     await page.getByText('Agent Thoughts').click();
     |                                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  39 |   });
  40 | 
  41 |   test('should render trajectory list and update active trajectory on click', async ({ page }) => {
  42 |     // Verify Left Column: Trajectories list renders correctly
  43 |     await expect(page.getByText('Active Intent Trajectories')).toBeVisible();
  44 |     await expect(page.getByText('traj_01')).toBeVisible();
  45 |     await expect(page.getByText('traj_02')).toBeVisible();
  46 |     await expect(page.getByText('Analyze and summarize patient blood test results.')).toBeVisible();
  47 |     await expect(page.getByText('Generate medical report')).toBeVisible();
  48 | 
  49 |     // Verify initial BCC Evaluation Score
  50 |     await expect(page.getByText('BCC Evaluation Score')).toBeVisible();
  51 |     await expect(page.getByText('950')).toBeVisible();
  52 | 
  53 |     // Verify initial Thought Trace
  54 |     await expect(page.getByText('Live Agent Cognition & Telemetry Trace')).toBeVisible();
  55 |     await expect(page.getByText('First thought')).toBeVisible();
  56 | 
  57 |     // Click the second trajectory
  58 |     await page.getByText('traj_02').click();
  59 | 
  60 |     // Verify BCC Evaluation Score updates to the second trajectory
  61 |     await expect(page.getByText('650')).toBeVisible();
  62 |     
  63 |     // Verify Thought Trace updates to the new steps
  64 |     await expect(page.getByText('generate_report')).toBeVisible();
  65 |     await expect(page.getByText('Drift warning')).toBeVisible();
  66 |     
  67 |     // Ensure the old thought trace is no longer visible
  68 |     await expect(page.getByText('First thought')).not.toBeVisible();
  69 |   });
  70 | 
  71 |   test('should render conditional status styling correctly', async ({ page }) => {
  72 |     const validStatus = page.locator('text=Validating');
  73 |     await expect(validStatus).toBeVisible();
  74 |     
  75 |     const driftStatus = page.locator('text=Drift Detected');
  76 |     await expect(driftStatus).toBeVisible();
  77 |   });
  78 | });
  79 | 
```