import type { Post } from '../types/feed';
import type { SituationAnalysis } from '../types/triage';

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    authorName: 'Adv. Sunita Sharma',
    authorTitle: 'Senior Legal Rights Specialist & Women advocate',
    isVerified: true,
    category: 'Legal Guidance',
    title: 'Understanding Workplace Quid Pro Quo Harassment: What Are Your Rights?',
    content: 'Many women struggle to identify where boundaries are crossed at work. "Quid Pro Quo" occurs when job benefits (promotions, raises) are made conditional on personal favors. Always keep a personal log of dates, times, and screenshots in a secure vault before filing an HR complaint.',
    tags: ['WorkplaceRights', 'LegalAid', 'SafetyFirst'],
    likesCount: 142,
    commentsCount: 18,
    timestamp: '2 hours ago',
  },
  {
    id: 'post-2',
    authorName: 'Dr. Priya Adhikari',
    authorTitle: 'Licensed Clinical Psychologist & Trauma Counselor',
    isVerified: true,
    category: 'Mental Health',
    title: '5 Grounding Techniques for Managing Anxiety During Workplace Conflict',
    content: 'Experiencing pressure or harassment at work can trigger high levels of stress and panic attacks. Practice the 5-4-3-2-1 sensory technique whenever you feel overwhelmed: identify 5 things you can see, 4 you can touch, 3 you hear, 2 you smell, and 1 slow breath.',
    tags: ['MentalHealth', 'SelfCare', 'Counseling'],
    likesCount: 289,
    commentsCount: 34,
    timestamp: ''
  },
  {
    id: 'post-3',
    authorName: 'Aarya Rijal',
    authorTitle: 'Corporate Diversity & Inclusion Lead',
    isVerified: false,
    category: 'Career Growth',
    title: 'Negotiating Salaries with Confidence: A Guide for Young Female Professionals',
    content: 'Never underestimate your market value. When negotiating your compensation, focus on data-driven achievements rather than emotional justification. Frame your contributions around revenue saved, efficiency increased, and leadership taken.',
    tags: ['CareerGrowth', 'SalaryNegotiation', 'WomenInLeadership'],
    likesCount: 512,
    commentsCount: 62,
    timestamp: '1 day ago',
  },
];

export const mockAnalysisResult: SituationAnalysis = {
  category: 'Workplace Sexual Harassment & Coercion',
  severity: 'Severe',
  riskLevel: 'High Risk',
  confidenceScore: 96,
  reasoning: 'The reported behavior involves repetitive unwanted personal dinner requests coupled with explicit conditional career-promotion threats (quid pro quo harassment).',
  legalOverview: 'Under employment equity and anti-harassment statutes, making promotion conditional on personal favors constitutes illegal coercion. Employers are legally mandated to maintain a safe, harassment-free work environment.',
  recommendedActions: [
    { id: 'act-1', title: 'Generate Formal HR Complaint', description: 'Convert your natural situation description into a professionally structured, legally articulated HR complaint letter.', category: 'complaint', targetRoute: '/drafts', priority: 'high' },
    { id: 'act-2', title: 'Store Supportive Evidence Privately', description: 'Upload relevant screenshots, email threads, or text messages into your encrypted, time-stamped Vault.', category: 'evidence', targetRoute: '/vault', priority: 'high' },
    { id: 'act-3', title: 'Consult Verified Employment Lawyer', description: 'Connect confidentially with specialized legal experts for legal rights assessment.', category: 'legal', targetRoute: '/directory?type=lawyer', priority: 'medium' },
    { id: 'act-4', title: 'Schedule Confidential Therapy Session', description: 'Book an appointment with verified workplace trauma and psychological support professionals.', category: 'therapy', targetRoute: '/directory?type=therapist', priority: 'medium' },
  ],
};
