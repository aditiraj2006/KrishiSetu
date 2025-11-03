// components/UserSearch.tsx
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2, X, Check, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  currentUserId: string;
  placeholder?: string;
  selectedUser?: User | null;
  onClearSelection?: () => void;
}

export function UserSearch({ 
  onUserSelect, 
  currentUserId, 
  placeholder = "Search users by name, username, or email...",
  selectedUser,
  onClearSelection
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleUserSelect(results[highlightedIndex]);
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

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      setIsOpen(true);
      setSearchError(null);
      
      try {
        const firebaseUid = localStorage.getItem('firebase-uid');
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'firebase-uid': firebaseUid || ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter out current user from results
          const filteredData = data.filter((user: User) => user.id !== currentUserId);
          setResults(filteredData);
          setHighlightedIndex(-1);
        } else {
          throw new Error('Failed to search users');
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchError('Failed to search for users');
        toast({
          title: 'Search Error',
          description: 'Failed to search for users',
          variant: 'destructive'
        });
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 200);
    return () => clearTimeout(timeoutId);
  }, [query, currentUserId, toast]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("recentUserSearches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);

    // Update recent searches
    const updated = [user, ...recentSearches.filter(u => u.id !== user.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentUserSearches", JSON.stringify(updated));
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onClearSelection) {
      onClearSelection();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
        {(query || selectedUser) && (
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
                {results.map((user, index) => (
                  <div
                    key={user.id}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`relative flex items-center p-3 cursor-pointer transition-colors ${
                      highlightedIndex === index
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleUserSelect(user)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {highlightMatch(user.name, query)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{highlightMatch(user.username, query)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {highlightMatch(user.email, query)}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    {highlightedIndex === index && (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                    )}
                    <div className="absolute left-full top-0 ml-2 w-64 p-2 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 transition">
                      <p><b>Name:</b> {user.name}</p>
                      <p><b>Email:</b> {user.email}</p>
                      <p><b>Role:</b> {user.role}</p>
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
                    <p>No users found matching "{query}"</p>
                    <p className="text-xs mt-1">Try different keywords</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {isOpen && query.length === 0 && recentSearches.length > 0 && (
        <div className="py-1">
          <div className="px-4 py-2 text-xs text-muted-foreground">Recent</div>
          {recentSearches.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center p-3 cursor-pointer hover:bg-muted"
              onClick={() => handleUserSelect(user)}
            >
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          ))}
          <button
            className="text-xs text-blue-600 hover:underline ml-4"
            onClick={() => {
              setRecentSearches([]);
              localStorage.removeItem("recentUserSearches");
            }}
          >
            Clear recent
          </button>
        </div>
      )}

      {searchError && (
        <div className="p-4 text-center text-red-500">
          {searchError}
        </div>
      )}

      {selectedUser && !query && (
        <div className="mt-2 border border-border rounded-md p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.profileImage} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{selectedUser.username} • {selectedUser.email}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {selectedUser.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}