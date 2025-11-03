// components/ProductSearch.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X, Package, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from "@shared/schema";

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  selectedProduct?: Product | null;
  onClearSelection?: () => void;
  searchEndpoint?: string; 
  ownerId?: string;
}

export function ProductSearch({
  onProductSelect,
  placeholder = "Search your products by name, category, farm, or batch ID...",
  selectedProduct,
  onClearSelection,
  searchEndpoint,
  ownerId,
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleProductSelect(results[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, highlightedIndex]);

  // Search logic
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      let url: string;
      if (searchEndpoint) {
        url = `${searchEndpoint}?q=${encodeURIComponent(searchQuery)}`;
      } else if (ownerId) {
        url = `/api/user/products/owned?q=${encodeURIComponent(searchQuery)}&ownerId=${ownerId}`;
      } else {
        setResults([]);
        setIsOpen(false);
        setIsSearching(false);
        return;
      }
      const response = await fetch(url, {
        headers: {
          'firebase-uid': user?.firebaseUid || ''
        }
      });
      if (!response.ok) throw new Error('Failed to search products');
      const data = await response.json();
      setResults(data);
      setHighlightedIndex(-1);
      setIsOpen(true);
    } catch (error) {
      console.error('Product search failed:', error);
      setSearchError('Failed to search products');
      toast({
        title: 'Search Error',
        description: 'Failed to search products',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  }, [ownerId, toast, user, searchEndpoint]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchProducts(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchProducts]);

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onClearSelection) onClearSelection();
    if (inputRef.current) inputRef.current.focus();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
          autoComplete="off"
          spellCheck="false"
        />
        {(query || selectedProduct) && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <div className="p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-auto">
          <div role="listbox">
            {results.length > 0 ? (
              <div className="py-1">
                {results.map((product, index) => (
                  <div
                    key={product.id}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`relative flex items-start p-3 cursor-pointer transition-colors ${
                      highlightedIndex === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleProductSelect(product)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Package className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{highlightMatch(product.name, query)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.quantity} {product.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{product.farmName}</span>
                      </div>
                      {product.batchId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Batch: {product.batchId}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Harvested: {formatDate(product.harvestDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center">
                {isSearching ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p>No products found matching "{query}"</p>
                    <p className="text-xs mt-1">Try different keywords</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
      {searchError && (
        <div className="p-4 text-center text-red-500">
          {searchError}
        </div>
      )}
      {selectedProduct && !query && (
        <div className="mt-2 border border-border rounded-md p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedProduct.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {selectedProduct.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedProduct.quantity} {selectedProduct.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProduct.farmName} • {formatDate(selectedProduct.harvestDate)}
              </p>
            </div>
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}