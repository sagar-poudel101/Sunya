import React, { useState } from 'react';
import { mockPosts } from '../services/mockFeedData';
import type { Post } from '../types/feed';
import {
  Sparkles, Heart, MessageSquare, Share2, CheckCircle2,
  TrendingUp, ShieldAlert, Filter, PlusCircle
} from 'lucide-react';

interface FeedPageProps {
  onNavigateToAssistant: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ onNavigateToAssistant }) => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newPostText, setNewPostText] = useState('');

  const categories = ['All', 'Legal Guidance', 'Mental Health', 'Career Growth', 'Safety Tips'];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: 'You (SafeSpace User)',
      authorTitle: 'Community Member',
      isVerified: false,
      category: 'Career Growth',
      title: 'Community Discussion',
      content: newPostText,
      tags: ['Discussion', 'Support'],
      likesCount: 0,
      commentsCount: 0,
      timestamp: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  const handleLike = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p));
  };

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-['Manrope'] grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SIDEBAR: Navigation & Categories */}
      <aside className="lg:col-span-3 space-y-4">
        
        {/* Quick AI Assistant Trigger Banner */}
        <div className="bg-linear-to-br from-[#7c6af2] to-[#6855e0] rounded-3xl p-5 text-white shadow-md">
          <div className="flex items-center space-x-2 text-[#DCD4FF] mb-2 font-['Sora'] font-bold text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            <span>AI Decision Engine</span>
          </div>
          <h3 className="font-extrabold text-lg font-['Sora'] leading-snug">
            Need Private AI Analysis?
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            Describe your situation privately. Get instant legal rights analysis and complaint drafts.
          </p>
          <button
            onClick={onNavigateToAssistant}
            className="mt-4 w-full py-2.5 px-4 bg-white text-[#7c6af2] hover:bg-[#DCD4FF] font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center space-x-2 font-['Sora']"
          >
            <span>Launch AI Assistant</span>
          </button>
        </div>

        {/* Categories Filter */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-['Sora'] flex items-center space-x-2">
            <Filter size={14} />
            <span>Feed Categories</span>
          </h4>
          <div className="flex flex-col space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-left text-xs font-bold px-3 py-2.5 rounded-xl transition ${
                  selectedCategory === cat
                    ? 'bg-[#DCD4FF]/60 text-[#7c6af2]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* CENTER FEED: Posts & Discussions */}
      <main className="lg:col-span-6 space-y-5">
        
        {/* Create Post Box */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              rows={3}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share a thought, ask for career advice, or start a discussion..."
              className="w-full p-3.5 border border-gray-200 rounded-2xl outline-none text-xs font-['Manrope'] focus:ring-2 focus:ring-[#7c6af2] resize-none"
            />
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-gray-400">
                💬 Post respectfully & support peers
              </span>
              <button
                type="submit"
                disabled={!newPostText.trim()}
                className="px-5 py-2.5 bg-[#7c6af2] hover:bg-[#6855e0] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-xs"
              >
                <PlusCircle size={15} />
                <span>Publish Post</span>
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts List */}
        {filteredPosts.map((post) => (
          <article key={post.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4 hover:border-[#7c6af2]/30 transition">
            
            {/* Post Author Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DCD4FF] text-[#7c6af2] font-bold font-['Sora'] flex items-center justify-center text-sm shadow-xs">
                  {post.authorName[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-sm font-bold text-gray-900 font-['Sora']">
                      {post.authorName}
                    </h4>
                    {post.isVerified && (
                      <CheckCircle2 size={15} className="text-[#7c6af2]" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-['Manrope']">
                    {post.authorTitle} • {post.timestamp}
                  </p>
                </div>
              </div>

              <span className="text-[10px] uppercase font-extrabold text-[#7c6af2] bg-[#DCD4FF]/50 px-2.5 py-1 rounded-full font-['Sora']">
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-gray-900 font-['Sora'] leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-['Manrope']">
                {post.content}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map(tag => (
                <span key={tag} className="text-[10px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md font-semibold">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Engagement Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 font-semibold">
              <button 
                onClick={() => handleLike(post.id)} 
                className="flex items-center space-x-1.5 hover:text-rose-500 transition"
              >
                <Heart size={16} />
                <span>{post.likesCount} Likes</span>
              </button>

              <button className="flex items-center space-x-1.5 hover:text-[#7c6af2] transition">
                <MessageSquare size={16} />
                <span>{post.commentsCount} Comments</span>
              </button>

              <button className="flex items-center space-x-1.5 hover:text-gray-900 transition">
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>

          </article>
        ))}

      </main>

      {/* RIGHT SIDEBAR: Verified Mentors & Emergency Line */}
      <aside className="lg:col-span-3 space-y-4">
        
        {/* Emergency Helpline Box */}
        <div className="bg-[#FF8A80]/15 border border-[#FF8A80]/50 rounded-3xl p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-[#D32F2F] font-bold font-['Sora']">
            <ShieldAlert size={18} />
            <span>Emergency Help</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            In immediate danger or physical threat? Reach local authorities or emergency hotlines immediately.
          </p>
          <a
            href="tel:100"
            className="block text-center py-2 bg-[#FF8A80] text-white font-bold rounded-xl hover:bg-red-500 transition shadow-xs"
          >
            Call Helpline 100 / 104
          </a>
        </div>

        {/* Verified Counselors Spotlight */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-['Sora'] flex items-center space-x-2">
            <TrendingUp size={14} />
            <span>Featured Mentors</span>
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900 font-['Sora']">Dr. Roshni Thapa</p>
                <p className="text-[10px] text-gray-500">Counseling Psychologist</p>
              </div>
              <button 
                onClick={onNavigateToAssistant}
                className="text-[10px] font-bold text-[#7c6af2] bg-[#DCD4FF]/60 px-2.5 py-1 rounded-lg hover:bg-[#7c6af2] hover:text-white transition"
              >
                Connect
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900 font-['Sora']">Adv. Nima Tamang</p>
                <p className="text-[10px] text-gray-500">Women Rights Advocate</p>
              </div>
              <button 
                onClick={onNavigateToAssistant}
                className="text-[10px] font-bold text-[#7c6af2] bg-[#DCD4FF]/60 px-2.5 py-1 rounded-lg hover:bg-[#7c6af2] hover:text-white transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

      </aside>

    </div>
  );
};