export type PostCategory = 'Legal Guidance' | 'Mental Health' | 'Career Growth' | 'Empowerment Stories' | 'Safety Tips';

export interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: string;
  isVerifiedProfessional?: boolean;
}

export interface Post {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  isVerified: boolean; // Verified Psychologist, Advocate, HR, etc.
  category: PostCategory;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  comments?: Comment[];
}