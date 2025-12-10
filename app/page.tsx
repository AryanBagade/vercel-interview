'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { MAX_AUTOCOMPLETE_RESULTS, MIN_QUERY_LENGTH } from "@/lib/constants";
import { Search, Sparkles, Command, ArrowUp, ArrowDown, CornerDownLeft, X, Loader2 } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pendingRequestRef = useRef<{
    controller: AbortController | null;
    timeoutId: ReturnType<typeof setTimeout> | null;
  }>({ controller: null, timeoutId: null });

  const trimmedQuery = query.trim();
  const shouldShowDropdown = isFocused && trimmedQuery.length >= MIN_QUERY_LENGTH && (isLoading || error || suggestions.length > 0);

  // Fetch suggestions
  useEffect(() => {
    const cancelPendingRequest = () => {
      pendingRequestRef.current.controller?.abort();
      if (pendingRequestRef.current.timeoutId) {
        clearTimeout(pendingRequestRef.current.timeoutId);
      }
      pendingRequestRef.current = { controller: null, timeoutId: null };
    };

    cancelPendingRequest();
    setSelectedIndex(-1);

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      setIsTruncated(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSuggestions(data.results);
        setIsTruncated(data.meta.truncated);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setSuggestions([]);
        setIsTruncated(false);
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150); // Debounce delay

    pendingRequestRef.current = { controller, timeoutId };

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    console.log("Selected:", suggestion);
    setQuery(suggestion);
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
    setIsTruncated(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSuggestions([]);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  }, [shouldShowDropdown, suggestions, selectedIndex, handleSuggestionClick]);

  const clearInput = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
    setIsTruncated(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const helperMessage = useMemo(() => {
    if (error) return null;
    if (trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH) {
      return `Type ${MIN_QUERY_LENGTH - trimmedQuery.length} more character${MIN_QUERY_LENGTH - trimmedQuery.length > 1 ? 's' : ''}`;
    }
    if (isTruncated) {
      return `Showing top ${MAX_AUTOCOMPLETE_RESULTS} results`;
    }
    return null;
  }, [trimmedQuery.length, error, isTruncated]);

  // Highlight matching prefix in suggestion
  const highlightMatch = (suggestion: string, query: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerSuggestion.startsWith(lowerQuery)) {
      return (
        <>
          <span className="text-white font-medium">{suggestion.slice(0, query.length)}</span>
          <span className="text-zinc-400">{suggestion.slice(query.length)}</span>
        </>
      );
    }
    return <span className="text-zinc-400">{suggestion}</span>;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[#0a0a0f]" />
      <div className="fixed inset-0 radial-gradient-bg" />
      <div className="fixed inset-0 grid-pattern" />
      <div className="fixed inset-0 noise-overlay" />

      {/* Floating orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="fixed top-1/2 right-1/3 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-zinc-400 font-medium">Powered by 438K+ words</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">Word</span>
            <span className="text-white">Finder</span>
          </h1>

          <p className="text-zinc-500 text-lg md:text-xl max-w-md mx-auto font-light">
            Lightning-fast autocomplete search across the entire English dictionary
          </p>
        </div>

        {/* Search container */}
        <div className="w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            {/* Search input wrapper */}
            <div
              className={`
                relative rounded-2xl transition-all duration-300 ease-out
                ${isFocused
                  ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5),0_0_40px_rgba(99,102,241,0.15)]'
                  : 'shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                }
                ${shouldShowDropdown ? 'rounded-b-none' : ''}
              `}
            >
              <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="flex items-center px-5 py-4">
                  {/* Search icon */}
                  <div className={`transition-colors duration-200 ${isFocused ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </div>

                  {/* Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for any word..."
                    className="flex-1 bg-transparent border-none outline-none px-4 text-lg text-white placeholder:text-zinc-600 font-light"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />

                  {/* Clear button */}
                  {query && (
                    <button
                      onClick={clearInput}
                      className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Keyboard shortcut hint */}
                  <div className="hidden md:flex items-center gap-1 ml-2 px-2 py-1 rounded-md bg-white/5 text-zinc-600 text-xs">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropdown */}
            {shouldShowDropdown && (
              <div
                className="absolute top-full left-0 right-0 z-50 glass-strong rounded-b-2xl border-t border-white/5 overflow-hidden animate-scale-in"
                style={{ transformOrigin: 'top center' }}
              >
                {/* Loading state */}
                {isLoading && (
                  <div className="px-5 py-8 flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20" />
                      <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                    </div>
                    <span className="text-zinc-500 text-sm">Searching...</span>
                  </div>
                )}

                {/* Error state */}
                {!isLoading && error && (
                  <div className="px-5 py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}

                {/* No results */}
                {!isLoading && !error && suggestions.length === 0 && (
                  <div className="px-5 py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Search className="w-5 h-5 text-zinc-500" />
                    </div>
                    <span className="text-zinc-500 text-sm">No matches found</span>
                  </div>
                )}

                {/* Results list */}
                {!isLoading && !error && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="max-h-80 overflow-y-auto py-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`
                          w-full px-5 py-3 flex items-center gap-3 text-left transition-all duration-150
                          ${selectedIndex === index
                            ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                            : 'border-l-2 border-transparent hover:bg-white/3'
                          }
                        `}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <Search className={`w-4 h-4 flex-shrink-0 ${selectedIndex === index ? 'text-indigo-400' : 'text-zinc-600'}`} />
                        <span className="text-base font-light tracking-wide font-mono">
                          {highlightMatch(suggestion, trimmedQuery)}
                        </span>
                        {selectedIndex === index && (
                          <div className="ml-auto flex items-center gap-1 text-zinc-600">
                            <CornerDownLeft className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer with keyboard hints */}
                {!isLoading && !error && suggestions.length > 0 && (
                  <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">
                            <ArrowUp className="w-3 h-3" />
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">
                            <ArrowDown className="w-3 h-3" />
                          </span>
                        </div>
                        <span>navigate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 text-[10px]">↵</span>
                        <span>select</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 text-[10px]">esc</span>
                        <span>close</span>
                      </div>
                    </div>
                    {isTruncated && (
                      <span className="text-zinc-500">
                        {suggestions.length} of many results
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Helper message */}
          {helperMessage && (
            <div className="mt-4 text-center animate-fade-in-up">
              <span className="text-sm text-zinc-500 font-light">{helperMessage}</span>
            </div>
          )}
        </div>

        {/* Features section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <FeatureCard
            icon="⚡"
            title="Instant Results"
            description="Binary search delivers results in milliseconds"
          />
          <FeatureCard
            icon="🎯"
            title="Prefix Matching"
            description="Find words as you type with smart suggestions"
          />
          <FeatureCard
            icon="📚"
            title="Comprehensive"
            description="Search across 438,000+ English words"
          />
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-zinc-600 text-sm">
            Built with Next.js • Tailwind CSS • TypeScript
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="glass rounded-xl p-6 hover:bg-white/[0.04] transition-colors duration-300 group">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-zinc-500 text-sm font-light">{description}</p>
    </div>
  );
}
