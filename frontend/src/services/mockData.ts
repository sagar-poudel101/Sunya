import type { SituationAnalysis } from '../types/triage';

export const mockAnalysisResult: SituationAnalysis = {
  category: "Workplace Sexual Harassment & Coercion",
  severity: "Severe",
  riskLevel: "High Risk",
  confidenceScore: 96,
  reasoning: "The reported behavior involves repetitive unwanted physical or personal dinner requests coupled with explicit conditional career promotion threats (quid pro quo harassment).",
  legalOverview: "Under employment equity and anti-harassment statutes, making promotion conditional on personal favors constitutes illegal coercion. Employers are legally mandated to maintain a safe, harassment-free work environment.",
  recommendedActions: [
    {
      id: "act-1",
      title: "Generate Formal HR Complaint",
      description: "Convert your natural situation description into a professionally structured, legally articulated HR complaint letter.",
      category: "complaint",
      targetRoute: "/drafts",
      priority: "high"
    },
    {
      id: "act-2",
      title: "Store Supportive Evidence Privately",
      description: "Upload relevant screenshots, email threads, or text messages into your encrypted, time-stamped Vault.",
      category: "evidence",
      targetRoute: "/vault",
      priority: "high"
    },
    {
      id: "act-3",
      title: "Consult Verified Employment Lawyer",
      description: "Connect confidentially with specialized legal experts for legal rights assessment.",
      category: "legal",
      targetRoute: "/directory?type=lawyer",
      priority: "medium"
    },
    {
      id: "act-4",
      title: "Schedule Confidential Therapy Session",
      description: "Book an appointment with verified workplace trauma and psychological support professionals.",
      category: "therapy",
      targetRoute: "/directory?type=therapist",
      priority: "medium"
    }
  ]
};