import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  SearchCriteria,
  SearchResponse,
  SearchResult,
  SavedSearch,
  SearchHistory,
  SearchSuggestion,
  SearchCategory,
  FilterSchema,
  FilterBuilderGroup,
} from "../types/search";

// Default search criteria
const defaultSearchCriteria: SearchCriteria = {
  query: "",
  category: "all",
  filters: [],
  sortBy: "relevance",
  sortOrder: "desc",
  tags: [],
};

// Search context interface
export interface SearchContextType {
  // Search state
  criteria: SearchCriteria;
  results: SearchResponse | null;
  isSearching: boolean;
  error: string | null;

  // Search actions
  setCriteria: (criteria: Partial<SearchCriteria>) => void;
  updateQuery: (query: string) => void;
  updateCategory: (category: SearchCategory) => void;
  addFilter: (field: string, operator: string, value: any) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  executeSearch: () => Promise<void>;
  clearSearch: () => void;

  // Saved searches
  savedSearches: SavedSearch[];
  saveCurrentSearch: (name: string) => Promise<void>;
  loadSavedSearch: (searchId: string) => void;
  deleteSavedSearch: (searchId: string) => void;

  // Search history
  searchHistory: SearchHistory[];
  clearHistory: () => void;

  // Suggestions
  suggestions: SearchSuggestion[];
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>;

  // Filter builder
  filterBuilder: FilterBuilderGroup | null;
  setFilterBuilder: (group: FilterBuilderGroup | null) => void;
  applyFilterBuilder: () => void;

  // Schema for dynamic filter building
  filterSchema: FilterSchema;
}

// Create context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Search provider component
interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  // Core search state
  const [criteria, setCriteriaState] = useState<SearchCriteria>(
    defaultSearchCriteria
  );
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extended search state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [filterBuilder, setFilterBuilder] = useState<FilterBuilderGroup | null>(
    null
  );

  // Filter schema for different search categories
  const filterSchema: FilterSchema = {
    tournaments: {
      name: {
        label: "Tournament Name",
        type: "text",
        operators: ["contains", "starts_with", "ends_with", "equals"],
      },
      status: {
        label: "Status",
        type: "select",
        operators: ["equals", "in"],
        options: [
          { value: "upcoming", label: "Upcoming" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      entry_fee: {
        label: "Entry Fee",
        type: "range",
        operators: ["between", "less_than", "greater_than"],
        validation: { min: 0, max: 1000 },
      },
      start_date: {
        label: "Start Date",
        type: "date",
        operators: ["equals", "greater_than", "less_than", "between"],
      },
      skill_level: {
        label: "Skill Level",
        type: "select",
        operators: ["equals", "in"],
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "professional", label: "Professional" },
        ],
      },
      participants: {
        label: "Participants",
        type: "range",
        operators: ["between", "less_than", "greater_than"],
        validation: { min: 2, max: 100 },
      },
      location: {
        label: "Location",
        type: "location",
        operators: ["contains", "equals"],
      },
      tags: {
        label: "Tags",
        type: "tags",
        operators: ["contains", "in"],
      },
    },
    users: {
      username: {
        label: "Username",
        type: "text",
        operators: ["contains", "starts_with", "equals"],
      },
      full_name: {
        label: "Full Name",
        type: "text",
        operators: ["contains", "starts_with", "equals"],
      },
      level: {
        label: "Level",
        type: "range",
        operators: ["between", "greater_than", "less_than"],
        validation: { min: 1, max: 100 },
      },
      games_played: {
        label: "Games Played",
        type: "range",
        operators: ["between", "greater_than", "less_than"],
        validation: { min: 0 },
      },
      join_date: {
        label: "Join Date",
        type: "date",
        operators: ["equals", "greater_than", "less_than", "between"],
      },
    },
    locations: {
      name: {
        label: "Location Name",
        type: "text",
        operators: ["contains", "starts_with", "equals"],
      },
      city: {
        label: "City",
        type: "text",
        operators: ["contains", "equals"],
      },
      type: {
        label: "Type",
        type: "select",
        operators: ["equals", "in"],
        options: [
          { value: "field", label: "Field" },
          { value: "arena", label: "Arena" },
          { value: "complex", label: "Complex" },
          { value: "park", label: "Park" },
        ],
      },
    },
  };

  // Load saved data from localStorage
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedSearchesData = localStorage.getItem("lfa-saved-searches");
        if (savedSearchesData) {
          setSavedSearches(JSON.parse(savedSearchesData));
        }

        const historyData = localStorage.getItem("lfa-search-history");
        if (historyData) {
          setSearchHistory(JSON.parse(historyData));
        }
      } catch (error) {
      }
    };

    loadSavedData();
  }, []);

  // Save data to localStorage
  const saveToPersistence = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
    }
  }, []);

  // Update search criteria
  const setCriteria = useCallback((newCriteria: Partial<SearchCriteria>) => {
    setCriteriaState((prev) => ({ ...prev, ...newCriteria }));
  }, []);

  // Update query
  const updateQuery = useCallback(
    (query: string) => {
      setCriteria({ query });
    },
    [setCriteria]
  );

  // Update category
  const updateCategory = useCallback(
    (category: SearchCategory) => {
      setCriteria({ category, filters: [] }); // Clear filters when changing category
    },
    [setCriteria]
  );

  // Add filter
  const addFilter = useCallback(
    (field: string, operator: string, value: any) => {
      const newFilter = {
        id: `${field}_${operator}_${Date.now()}`,
        type: "text" as const,
        field,
        operator: operator as any,
        value,
        label: `${field} ${operator} ${value}`,
      };

      setCriteria({
        filters: [...criteria.filters, newFilter],
      });
    },
    [criteria.filters, setCriteria]
  );

  // Remove filter
  const removeFilter = useCallback(
    (filterId: string) => {
      setCriteria({
        filters: criteria.filters.filter((f) => f.id !== filterId),
      });
    },
    [criteria.filters, setCriteria]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setCriteria({ filters: [] });
  }, [setCriteria]);

  // Mock search execution (replace with actual API call)
  const executeSearch = useCallback(async () => {
    setIsSearching(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock search results
      const mockResults: SearchResponse = {
        results: generateMockResults(criteria),
        totalCount: 25,
        hasMore: true,
        facets: [
          {
            field: "status",
            label: "Status",
            values: [
              { value: "upcoming", label: "Upcoming", count: 12 },
              { value: "active", label: "Active", count: 8 },
              { value: "completed", label: "Completed", count: 5 },
            ],
          },
        ],
        suggestions: [
          "football tournament",
          "local matches",
          "beginner friendly",
        ],
        executionTime: 156,
        searchId: `search_${Date.now()}`,
      };

      setResults(mockResults);

      // Add to search history
      const historyEntry: SearchHistory = {
        id: `history_${Date.now()}`,
        query: criteria.query,
        category: criteria.category,
        userId: 1, // Get from auth context
        timestamp: new Date(),
        resultCount: mockResults.totalCount,
      };

      const newHistory = [historyEntry, ...searchHistory.slice(0, 49)]; // Keep last 50
      setSearchHistory(newHistory);
      saveToPersistence("lfa-search-history", newHistory);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [criteria, searchHistory, saveToPersistence]);

  // Generate mock search results
  const generateMockResults = (criteria: SearchCriteria): SearchResult[] => {
    const baseResults: SearchResult[] = [
      {
        id: 1,
        type: "tournaments",
        title: "Friday Night Football Championship",
        subtitle: "NYC Football League",
        description: "Weekly competitive tournament for serious players",
        thumbnail: "/api/placeholder/100/100",
        url: "/tournaments/1",
        metadata: {
          status: "upcoming",
          entryFee: 25,
          participants: 12,
          maxParticipants: 16,
          startDate: new Date(Date.now() + 86400000),
        },
        relevanceScore: 0.95,
        highlights: ["Football", "Championship"],
      },
      {
        id: 2,
        type: "users",
        title: "Alex Rodriguez",
        subtitle: "Level 15 • 150 games played",
        description: "Experienced player looking for competitive matches",
        thumbnail: "/api/placeholder/60/60",
        url: "/users/2",
        metadata: {
          level: 15,
          gamesPlayed: 150,
          winRate: 0.68,
          joinDate: new Date("2023-01-15"),
        },
        relevanceScore: 0.82,
      },
      {
        id: 3,
        type: "locations",
        title: "Central Park Sports Complex",
        subtitle: "New York, NY",
        description:
          "Professional-grade football fields with modern facilities",
        thumbnail: "/api/placeholder/100/100",
        url: "/locations/3",
        metadata: {
          type: "complex",
          fields: 4,
          rating: 4.8,
          amenities: ["parking", "restrooms", "lighting"],
        },
        relevanceScore: 0.76,
      },
    ];

    // Filter based on category
    if (criteria.category !== "all") {
      return baseResults.filter((r) => r.type === criteria.category);
    }

    return baseResults;
  };

  // Clear search
  const clearSearch = useCallback(() => {
    setCriteriaState(defaultSearchCriteria);
    setResults(null);
    setError(null);
  }, []);

  // Save current search
  const saveCurrentSearch = useCallback(
    async (name: string) => {
      const savedSearch: SavedSearch = {
        id: `saved_${Date.now()}`,
        name,
        criteria: { ...criteria },
        userId: 1, // Get from auth context
        isBookmarked: false,
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 1,
      };

      const newSavedSearches = [savedSearch, ...savedSearches];
      setSavedSearches(newSavedSearches);
      saveToPersistence("lfa-saved-searches", newSavedSearches);
    },
    [criteria, savedSearches, saveToPersistence]
  );

  // Load saved search
  const loadSavedSearch = useCallback(
    (searchId: string) => {
      const savedSearch = savedSearches.find((s) => s.id === searchId);
      if (savedSearch) {
        setCriteriaState(savedSearch.criteria);

        // Update last used
        const updatedSearches = savedSearches.map((s) =>
          s.id === searchId
            ? { ...s, lastUsed: new Date(), useCount: s.useCount + 1 }
            : s
        );
        setSavedSearches(updatedSearches);
        saveToPersistence("lfa-saved-searches", updatedSearches);
      }
    },
    [savedSearches, saveToPersistence]
  );

  // Delete saved search
  const deleteSavedSearch = useCallback(
    (searchId: string) => {
      const updatedSearches = savedSearches.filter((s) => s.id !== searchId);
      setSavedSearches(updatedSearches);
      saveToPersistence("lfa-saved-searches", updatedSearches);
    },
    [savedSearches, saveToPersistence]
  );

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem("lfa-search-history");
  }, []);

  // Get suggestions (mock implementation)
  const getSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestion[]> => {
      if (!query || query.length < 2) return [];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      const mockSuggestions: SearchSuggestion[] = [
        { text: "football tournament", type: "query" as const, popularity: 95 },
        { text: "soccer championship", type: "query" as const, popularity: 87 },
        { text: "local matches", type: "query" as const, popularity: 76 },
        {
          text: "beginner friendly",
          type: "filter" as const,
          category: "tournaments" as SearchCategory,
          popularity: 65,
        },
        {
          text: "tournaments",
          type: "category" as const,
          category: "tournaments" as SearchCategory,
          popularity: 90,
        },
      ].filter((s) => s.text.toLowerCase().includes(query.toLowerCase()));

      setSuggestions(mockSuggestions);
      return mockSuggestions;
    },
    []
  );

  // Apply filter builder
  const applyFilterBuilder = useCallback(() => {
    if (!filterBuilder) return;

    // Convert filter builder to search filters
    const convertGroupToFilters = (group: FilterBuilderGroup): any[] => {
      const filters: any[] = [];

      group.rules.forEach((rule) => {
        if ("field" in rule) {
          filters.push({
            id: rule.id,
            type: rule.type,
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
            label: `${rule.field} ${rule.operator} ${rule.value}`,
          });
        } else {
          filters.push(...convertGroupToFilters(rule));
        }
      });

      return filters;
    };

    const newFilters = convertGroupToFilters(filterBuilder);
    setCriteria({ filters: newFilters });
  }, [filterBuilder, setCriteria]);

  const contextValue: SearchContextType = {
    // State
    criteria,
    results,
    isSearching,
    error,

    // Actions
    setCriteria,
    updateQuery,
    updateCategory,
    addFilter,
    removeFilter,
    clearFilters,
    executeSearch,
    clearSearch,

    // Saved searches
    savedSearches,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,

    // History
    searchHistory,
    clearHistory,

    // Suggestions
    suggestions,
    getSuggestions,

    // Filter builder
    filterBuilder,
    setFilterBuilder,
    applyFilterBuilder,

    // Schema
    filterSchema,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

// Hook to use search context
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export default SearchContext;
