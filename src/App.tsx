/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

// Mocking imports for now until URL is provided
const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || "";

export default function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOption, setSortOption] = useState('latest');

  useEffect(() => {
    fetchPosts();
    fetchComments();
  }, []);

  const fetchComments = async () => {
    if (!GAS_API_URL) return;
    try {
      const response = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "getComments", token: "placeholder" })
      });
      const result = await response.json();
      if (result && result.success) {
        const commentMap = {};
        result.data.forEach(c => {
          if (!commentMap[c.postId]) commentMap[c.postId] = [];
          commentMap[c.postId].push(c);
        });
        setComments(commentMap);
      }
    } catch (error) {
      console.error("Could not fetch comments", error);
    }
  };

  const fetchPosts = async () => {
    if (!GAS_API_URL) return;
    try {
      const response = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: "getRecords", sheet: "Posts", token: "placeholder" })
      });
      let result;
      try {
        result = await response.json();
      } catch (err) {
        console.error("Non-JSON response from server, check GAS deployment. Error:", err);
        return;
      }
      if (result && result.success) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error("Could not reach the server", error);
    }
  };

  const handleUpvote = async (postId) => {
    if (!GAS_API_URL) return;
    try {
      const response = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: "upvotePost", postId, token: "placeholder" })
      });
      if (response.ok) {
        fetchPosts(); // Refresh
      }
    } catch (error) {
       console.error("Could not reach the server", error);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentInputs[postId]?.trim() || !GAS_API_URL) return;

    try {
      const response = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: "addComment", 
          postId, 
          comment: commentInputs[postId],
          token: "placeholder" 
        })
      });
      if (response.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchComments();
      }
    } catch (error) {
      console.error("Could not submit comment", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    if (!GAS_API_URL) {
      console.warn("GAS_API_URL is not set");
      setIsSubmitting(false);
      return;
    }
    const newPost = {
      id: crypto.randomUUID(),
      title,
      content,
      category: "General",
      author: "Anonymous",
      tags: tags.trim(),
      timestamp: new Date().toLocaleDateString(),
      createdAt: Date.now(),
      upvotes: 0
    };

    try {
      const response = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ 
          action: "addRecord", 
          sheet: "Posts", 
          row: newPost,
          token: "placeholder" 
        })
      });
      if (response.ok) {
        setTitle('');
        setContent('');
        setTags('');
        fetchPosts(); // Refresh
      }
    } catch (error) {
      console.error("Could not reach the server", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans">
      <header className="border-b-4 border-[#1A1A1A] p-6 text-center relative">
        <div className="mb-8">
          <h2 className="font-sans font-bold tracking-[0.2em] text-sm md:text-base text-gray-600 uppercase">Allen County Indiana</h2>
          <h2 className="font-serif font-black text-4xl md:text-5xl text-[#A02C2C] uppercase tracking-tighter mt-1">Three Rivers of Shit</h2>
        </div>
        <h1 className="font-serif text-3xl md:text-5xl uppercase tracking-tighter">Divorce, Custody, Child Support</h1>
        <p className="font-serif italic text-sm md:text-base mt-3 text-gray-600">
          How the United States has destroyed its own civilization with divorce and child support wrecking family's
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 gap-8">
        <div className="flex justify-center p-4 animate-bounce">
          <a href="#post-your-story" className="bg-[#1A1A1A] text-white py-4 px-8 text-sm md:text-base font-bold tracking-widest uppercase hover:bg-[#A02C2C] transition-colors shadow-lg">
            Post Your Story
          </a>
        </div>
        
        <section className="w-full max-w-2xl">
          <h2 className="font-serif text-2xl mb-6 italic border-b border-[#E5E7EB] pb-2">Latest Testimony</h2>
          
          <div className="mb-4">
            <label className="text-sm font-semibold">Sort by: </label>
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-sm border border-[#E5E7EB] p-1 rounded">
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {!GAS_API_URL && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-6 rounded-sm text-sm">
              <strong>Configuration Missing:</strong> You must configure <code>VITE_GAS_API_URL</code> via the Secrets panel in AI Studio for the application to function.
            </div>
          )}

          {posts.length === 0 && GAS_API_URL && (
            <div className="text-center text-[#6B7280] italic py-8">
              No testimony submitted yet. Be the first to share your experience.
            </div>
          )}

          {[...posts].map((post, index) => ({...post, _index: index})).sort((a, b) => {
            const dateA = a.createdAt || Date.parse(a.timestamp) || 0;
            const dateB = b.createdAt || Date.parse(b.timestamp) || 0;
            
            if (dateA !== dateB) {
              return sortOption === 'latest' ? dateB - dateA : dateA - dateB;
            }
            return sortOption === 'latest' ? b._index - a._index : a._index - b._index;
          }).map((post) => (
             <div key={post.id} className="border border-[#E5E7EB] p-6 bg-white shadow-sm mb-4">
                <div className="flex flex-col md:flex-row md:justify-between mb-4 gap-1">
                  <h3 className="font-bold text-lg md:text-xl leading-snug break-words">{post.title}</h3>
                  <span className="text-xs md:text-sm text-[#6B7280] flex-shrink-0 opacity-80">{post.timestamp}</span>
                </div>
                <div className="text-sm md:text-base leading-relaxed mb-6 space-y-4 text-[#374151]">
                  {post.content ? String(post.content).split('\n').map((paragraph, index) => (
                    paragraph.trim() ? <p key={index} className="break-words whitespace-pre-wrap">{paragraph}</p> : null
                  )) : null}
                </div>
                {post.tags && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {String(post.tags).split(',').map(tag => tag.trim()).filter(tag => tag !== '').map(tag => (
                       <span key={tag} className="font-mono text-xs bg-[#F1F5F9] px-2 py-1 rounded text-[#6B7280]">{tag}</span>
                    ))}
                  </div>
                )}
                <button onClick={() => handleUpvote(post.id)} className="border border-[#1A1A1A] px-6 py-2 text-sm font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors mb-6">▲ ME TOO ({post.upvotes || 0})</button>
                
                <div className="border-t border-[#E5E7EB] pt-4 mt-2">
                  <h4 className="font-bold text-sm mb-2">Comments</h4>
                  <div className="space-y-2 mb-4">
                    {(comments[post.id] || []).map((c, i) => (
                      <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                        <span className="font-semibold">{c.author}: </span>{c.comment}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 border border-[#E5E7EB] p-2 text-sm"
                      placeholder="Add a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    />
                    <button onClick={() => handleCommentSubmit(post.id)} className="bg-[#1A1A1A] text-white px-4 py-2 text-sm font-bold hover:bg-[#A02C2C]">Post</button>
                  </div>
                </div>
             </div>
          ))}
        </section>

        <section id="post-your-story" className="w-full max-w-2xl border-t border-[#E5E7EB] pt-8">
          <h2 className="font-serif text-2xl mb-4 italic">Post Your Experience</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Title" 
              className="border border-[#E5E7EB] p-4 text-sm md:text-base focus:outline-none focus:border-[#1A1A1A]" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input 
              type="text" 
              placeholder="Tags (comma-separated, e.g. #WillCall, #NoCounsel)" 
              className="border border-[#E5E7EB] p-4 text-sm md:text-base focus:outline-none focus:border-[#1A1A1A]" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <textarea 
              placeholder="Share your experience..." 
              className="border border-[#E5E7EB] p-4 text-sm md:text-base min-h-40 md:min-h-56 focus:outline-none focus:border-[#1A1A1A] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
            <button 
              type="submit" 
              className="bg-[#1A1A1A] text-white py-4 px-6 font-bold text-sm md:text-base tracking-widest uppercase hover:bg-[#A02C2C] transition-colors disabled:opacity-50 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Testimony'}
            </button>
          </form>
        </section>
      </main>

      <footer className="border-t border-[#E5E7EB] p-6 text-center text-xs text-[#6B7280]">
        Dedicated to Kahler and Chad Falls
      </footer>
    </div>
  );
}


