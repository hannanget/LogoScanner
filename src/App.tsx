import React, { useState } from 'react';
import { Search, Image as ImageIcon, Filter, ExternalLink, Loader2, X, Download, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { LogoResult, SearchSource } from './types';

// Mock data for initial state or when API fails
const SAMPLE_LOGOS: LogoResult[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&q=80&w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&q=80&w=200',
    title: 'Modern Coffee Logo Design',
    source: 'Dribbble',
    sourceUrl: 'https://dribbble.com/shots/modern-coffee'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&q=80&w=400',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&q=80&w=200',
    title: 'Artisan Coffee Roasters',
    source: 'Behance',
    sourceUrl: 'https://behance.net/gallery/artisan-coffee'
  }
];

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<SearchSource>('all');
  const [results, setResults] = useState<LogoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<LogoResult | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const performSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const sourceQuery = (selectedSource !== 'all') ? ` on ${selectedSource}` : '';
      const prompt = `Search for real logo design images related to "${query}"${sourceQuery}. 
      Return a JSON array of 12 objects representing the best logo matches.
      Each object must have:
      - id: unique string
      - url: direct link to the image (full size)
      - thumbnailUrl: link to a smaller version ideally
      - title: a 3-5 word description of the logo
      - source: the platform name (e.g., "Freelancer", "Dribbble")
      - sourceUrl: link to the actual page where the logo is found

      ONLY return the JSON array. Do not include any other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                url: { type: Type.STRING },
                thumbnailUrl: { type: Type.STRING },
                title: { type: Type.STRING },
                source: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
              },
              required: ["id", "url", "title", "source", "sourceUrl"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      if (data.length === 0) {
        setError("No logos found for this search. Using sample data for layout.");
        setResults(SAMPLE_LOGOS);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. This might be due to API limits or connectivity. Showing sample data.");
      setResults(SAMPLE_LOGOS);
    } finally {
      setLoading(false);
    }
  };

  const categories: { label: string; value: SearchSource }[] = [
    { label: 'All', value: 'all' },
    { label: 'Freelancer', value: 'freelancer.com' },
    { label: 'Behance', value: 'behance.net' },
    { label: 'Dribbble', value: 'dribbble.com' },
    { label: '99Designs', value: '99designs.com' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header / Search Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">LogoSeeker</h1>
          </div>

          <form onSubmit={performSearch} className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logos (e.g., 'coffee', 'minimalist tech', 'vintage bakery')..."
              className="w-full bg-stone-100 border-transparent focus:bg-white focus:border-orange-500 border-2 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all text-lg placeholder:text-stone-400 shadow-sm"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white p-2 rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="hidden lg:flex items-center gap-2 text-stone-500 text-sm">
            <Globe className="w-4 h-4" />
            <span>AI-Powered Search</span>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto mt-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedSource(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedSource === cat.value
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results Main Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
            <div className="bg-red-100 p-1 rounded-lg mt-0.5">
              <X className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Notice</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">Find the perfect inspiration</h2>
            <p className="text-stone-500 max-w-md">Type a business type, industry, or style to explore professional logo designs and contest results.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Tech Startup', 'Organic Food', 'Cyberpunk', 'Luxury Watch', 'Fitness App'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => { setQuery(tag); performSearch(); }}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-stone-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {results.map((logo, index) => (
              <motion.div
                key={logo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layoutId={`card-${logo.id}`}
                onClick={() => setActiveImage(logo)}
                className="group relative aspect-square bg-white border border-stone-100 rounded-2xl overflow-hidden cursor-zoom-in hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={logo.thumbnailUrl || logo.url}
                  alt={logo.title}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400?text=Logo+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-white text-xs font-semibold truncate">{logo.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/80 text-[10px] uppercase tracking-wider font-bold bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {logo.source}
                    </span>
                    <ExternalLink className="w-3 h-3 text-white/80" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Lightbox / Immersive View */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-white/95 backdrop-blur-xl"
            onClick={() => setActiveImage(null)}
          >
            <motion.div
              layoutId={`card-${activeImage.id}`}
              className="relative max-w-5xl w-full flex flex-col md:flex-row gap-8 bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 bg-stone-50 flex items-center justify-center p-8 min-h-[300px]">
                <img
                  src={activeImage.url}
                  alt={activeImage.title}
                  className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
                />
                <button
                  onClick={() => setActiveImage(null)}
                  className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors border border-stone-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full md:w-80 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{activeImage.source}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-4">{activeImage.title}</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-stone-100 rounded-2xl">
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Inspiration</p>
                      <p className="text-sm text-stone-700">Perfect for brands looking for a {query} style identity. Found in recent contests.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-8">
                  <a
                    href={activeImage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-semibold transition-all group"
                  >
                    View Source <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                  <button
                    onClick={() => window.open(activeImage.url, '_blank')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-stone-200 hover:border-orange-500 hover:text-orange-600 text-stone-600 rounded-2xl font-semibold transition-all"
                  >
                    <Download className="w-4 h-4" /> Save Image
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto p-8 border-t border-stone-200 mt-12 flex flex-col md:flex-row items-center justify-between text-stone-400 text-xs text-center md:text-left">
        <p>© 2026 LogoSeeker. Powered by Gemini Search Grounding.</p>
        <div className="flex gap-6 mt-4 md:mt-0 justify-center">
          <a href="#" className="hover:text-stone-600">Privacy</a>
          <a href="#" className="hover:text-stone-600">Terms</a>
          <a href="#" className="hover:text-stone-600">Help</a>
        </div>
      </footer>
    </div>
  );
}
