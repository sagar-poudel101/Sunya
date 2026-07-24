// src/pages/FeedPage.tsx
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  Heart, 
  MessageSquare, 
  Share2, 
  Filter,
  Send,
  Info,
  Award
} from 'lucide-react';

interface FeedPageProps {
  onNavigateToAssistant: () => void;
  onNavigateToTriage: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ onNavigateToAssistant, onNavigateToTriage }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Maya Sharma',
      role: 'Verified Rights Advocate',
      category: 'Workplace Protection',
      time: '2 hours ago',
      content: 'Always keep objective written records of communication, project handoffs, and performance reviews. Conditional workplace perks or pressure tied to personal favors violate standard labor rights.',
      likes: 28,
      comments: 6,
      isLiked: false
    },
    {
      id: 2,
      author: 'Legal Resource Note',
      role: 'Official Guide',
      category: 'Legal Rights',
      time: 'Yesterday',
      content: 'When submitting a formal complaint to HR or an Internal Complaints Committee (ICC), ensure your documentation covers dates, exact times, specific occurrences, and witness details.',
      likes: 45,
      comments: 12,
      isLiked: false
    }
  ]);

  const categories = ['All', 'Workplace Protection', 'Legal Rights', 'Safety Tips', 'Mentorship'];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const createdPost = {
      id: Date.now(),
      author: 'Anonymous Community Member',
      role: 'Community Post',
      category: activeCategory === 'All' ? 'General' : activeCategory,
      time: 'Just now',
      content: newPost,
      likes: 0,
      comments: 0,
      isLiked: false
    };

    setPosts([createdPost, ...posts]);
    setNewPost('');
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const filteredPosts = activeCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 font-['Manrope']">
      
      {/* 🚀 1-CLICK STEALTH TRIAGE HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-gray-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-200 border border-white/10">
              <Lock size={12} className="text-emerald-400" />
              <span>Encrypted Stealth Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-['Sora'] leading-tight">
              Need to Safely Document an Incident or Whistleblow?
            </h2>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              Use our guided 4-step logging form to record facts, voice notes, and witness details, or dispatch an anonymous report directly to authorities.
            </p>
          </div>

          <button
            onClick={onNavigateToTriage}
            className="px-6 py-3.5 bg-[#7c6af2] hover:bg-[#6855e0] text-white text-xs font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2.5 whitespace-nowrap cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShieldAlert size={16} />
            <span>Launch Stealth Triage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 🤝 MENTORSHIP & LEGAL AID CALLOUT */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-[#7c6af2] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 font-['Sora']">
              Connect with Verified Women Mentors & Legal Advisors
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Get 1-on-1 confidential guidance on career navigation, rights defense, and workplace support.
            </p>
          </div>
        </div>
        <button 
          onClick={onNavigateToAssistant}
          className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition whitespace-nowrap shadow-xs"
        >
          Request Mentor Advice
        </button>
      </div>

      {/* ✍️ CREATE POST BOX */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase font-['Sora']">Share updates or ask the community</h3>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share insights, workplace rights questions, or safety advice..."
            rows={3}
            className="w-full p-3.5 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#7c6af2] resize-none"
          />
          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-semibold">
              <Info size={14} className="text-[#7c6af2]" />
              <span>Posts are reviewed to keep the community safe and constructive.</span>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-[#7c6af2] hover:bg-[#6855e0] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs"
            >
              <Send size={13} />
              <span>Post Update</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🔍 FILTER BUTTONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-[#7c6af2]" />
            <h3 className="text-sm font-extrabold text-gray-900 font-['Sora']">Filter Feed Topics</h3>
          </div>
          
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 📰 POSTS LIST */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
                    {post.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{post.author}</h4>
                    <p className="text-[10px] text-gray-400">{post.time} • {post.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#7c6af2] bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                {post.content}
              </p>

              <div className="flex items-center space-x-6 pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1.5 hover:text-red-500 transition ${post.isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart size={16} className={post.isLiked ? 'fill-red-500' : ''} />
                  <span>{post.likes} Likes</span>
                </button>

                <button className="flex items-center space-x-1.5 hover:text-gray-900 transition">
                  <MessageSquare size={16} />
                  <span>{post.comments} Comments</span>
                </button>

                <button className="flex items-center space-x-1.5 hover:text-gray-900 transition">
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
