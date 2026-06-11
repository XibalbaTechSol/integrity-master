import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { Agent } from '../../types';

interface IntegrityRadarProps {
  agent: Agent;
}

export function IntegrityRadar({ agent }: IntegrityRadarProps) {
  // Convert 0-1000 scores to 0-100 scale for normalized radar visualization
  const data = [
    { subject: 'Stability (1-E)', value: (agent.entropy_score / 10) },
    { subject: 'Grounding', value: (agent.grounding_score / 10) },
    { subject: 'Sacrifice', value: (agent.sacrifice_score / 10) },
    { subject: 'Identity', value: agent.verification_tier * 33.3 },
    { subject: 'Compliance', value: agent.compliance_score },
  ];

  return (
    <div style={{ width: '100%', height: '240px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--glass-border)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
          />
          <Radar
            name="AIS Metrics"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
