import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatHKD } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchResult {
  id: number;
  name: string;
  nameZh?: string | null;
  brand: string | null;
  dailyRate: string | null;
  imageUrl: string | null;
  categoryId: number;
}

export default function SearchBar() {
  const [, navigate] = useLocation();
  const { tk, t, pickLang } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search API call
  const searchQuery = trpc.equipment.search.useQuery(
    { query, limit: 8 },
    { enabled: query.length > 0 }
  );

  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data as SearchResult[]);
      setSelectedIndex(-1);
    }
  }, [searchQuery.data]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    navigate(`/product/${result.id}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder={tk("search_placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => setIsOpen(query.length > 0)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-10 py-3 bg-white/10 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white/20 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setResults([]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-orange-500/30 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto"
          style={{ minWidth: '100%', width: 'max(100%, min(480px, 90vw))' }}>
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 flex items-center gap-3 border-b border-slate-800 last:border-b-0 transition-colors ${
                selectedIndex === index ? "bg-orange-500/20" : "hover:bg-slate-800"
              }`}
            >
              <div className="w-12 h-12 bg-white rounded overflow-hidden p-1 flex-shrink-0">
                <img
                  src={result.imageUrl ?? undefined}
                  alt={pickLang(result.name, result.nameZh)}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">{pickLang(result.name, result.nameZh)}</p>
                <p className="text-gray-400 text-xs">
                  {result.brand ?? ""}
                </p>
              </div>
              {result.dailyRate && (
                <p className="text-orange-500 font-semibold text-sm">
                  {formatHKD(result.dailyRate)}{tk("per_day")}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query.length > 0 && results.length === 0 && !searchQuery.isLoading && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-orange-500/30 rounded-lg p-4 text-center text-gray-400 z-[9999]"
          style={{ minWidth: '100%', width: 'max(100%, min(480px, 90vw))' }}>
          {t(`No tools found matching "${query}"`, `找不到符合「${query}」的工具`)}
        </div>
      )}

      {/* Loading State */}
      {searchQuery.isLoading && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-orange-500/30 rounded-lg p-4 text-center text-gray-400 z-[9999]"
          style={{ minWidth: '100%', width: 'max(100%, min(480px, 90vw))' }}>
          {tk("common_loading")}
        </div>
      )}
    </div>
  );
}
