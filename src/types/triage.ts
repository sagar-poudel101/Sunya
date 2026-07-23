
export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Emergency';

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'complaint' | 'therapy' | 'evidence' | 'emergency';
  targetRoute?: string; 
  priority: 'high' | 'medium' | 'low';
}

export interface SituationAnalysis {
  category: string;             
  severity: 'Mild' | 'Moderate' | 'Severe';
  riskLevel: RiskLevel;
  confidenceScore: number;
  reasoning: string;            
  legalOverview: string;        
  recommendedActions: ActionRecommendation[];
}