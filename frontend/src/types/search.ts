// Search system types for LFA Legacy GO
export interface SearchCriteria {
  query: string;
  category: SearchCategory;
  filters: SearchFilter[];
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  dateRange?: DateRange;
  location?: LocationFilter;
  priceRange?: PriceRange;
  skillLevel?: SkillLevel[];
  tags?: string[];
}

export type SearchCategory = 
  | 'all'
  | 'tournaments' 
  | 'users' 
  | 'locations' 
  | 'matches'
  | 'admin_users'
  | 'admin_reports';

export interface SearchFilter {
  id: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: any;
  label: string;
}

export type FilterType = 
  | 'text'
  | 'number' 
  | 'date'
  | 'select'
  | 'multiselect'
  | 'range'
  | 'boolean'
  | 'location'
  | 'tags';

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'not_null';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface LocationFilter {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  city?: string;
  state?: string;
  country?: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type SortOption = 
  | 'relevance'
  | 'date_created'
  | 'date_updated'
  | 'name'
  | 'price'
  | 'participants'
  | 'start_date'
  | 'popularity'
  | 'rating';

export interface SearchResult<T = any> {
  id: string | number;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  url?: string;
  metadata: T;
  relevanceScore: number;
  highlights?: string[];
}

export interface SearchResponse<T = any> {
  results: SearchResult<T>[];
  totalCount: number;
  hasMore: boolean;
  facets: SearchFacet[];
  suggestions: string[];
  executionTime: number;
  searchId: string;
}

export interface SearchFacet {
  field: string;
  label: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  userId: number;
  isBookmarked: boolean;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export interface SearchHistory {
  id: string;
  query: string;
  category: SearchCategory;
  userId: number;
  timestamp: Date;
  resultCount: number;
  clicked?: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'category';
  category?: SearchCategory;
  popularity: number;
  metadata?: any;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  popularQueries: { query: string; count: number }[];
  popularCategories: { category: SearchCategory; count: number }[];
  avgResultsPerSearch: number;
  clickThroughRate: number;
  noResultsRate: number;
  timeRange: DateRange;
}

// Filter builder types
export interface FilterBuilderRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  type: FilterType;
}

export interface FilterBuilderGroup {
  id: string;
  operator: 'AND' | 'OR';
  rules: (FilterBuilderRule | FilterBuilderGroup)[];
}

export interface FilterSchema {
  [category: string]: {
    [field: string]: {
      label: string;
      type: FilterType;
      operators: FilterOperator[];
      options?: { value: any; label: string }[];
      validation?: {
        min?: number;
        max?: number;
        required?: boolean;
      };
    };
  };
}