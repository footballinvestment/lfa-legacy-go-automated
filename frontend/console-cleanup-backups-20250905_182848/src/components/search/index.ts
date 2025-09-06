// Search component exports
export { default as AdvancedSearchComponent } from "./AdvancedSearchComponent";
export { default as SearchResults } from "./SearchResults";
export { default as SearchFilters } from "./SearchFilters";
export { default as SearchSuggestions } from "./SearchSuggestions";
export { default as SavedSearches } from "./SavedSearches";
export { default as SearchHistory } from "./SearchHistory";

// Re-export search context and types
export { SearchProvider, useSearch } from "../../contexts/SearchContext";
export type {
  SearchCriteria,
  SearchResponse,
  SearchResult,
  SearchCategory,
  SearchFilter,
  SavedSearch,
  SearchHistory as SearchHistoryType,
  SearchSuggestion,
} from "../../types/search";
