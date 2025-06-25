import { Tutor } from './Tutor';
import { Category } from './Category';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string;
  difficulty_level: string;
  plan: string;
  categories: Category[];
  tutors: Tutor[];
  progress?: number;
  isEnrolled?: boolean;
  createdAt?: string;
  popularity?: number;
  thumbnail_video_url?: string | null;
  lessons?: any[];
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string[];
  tutorId?: string[];
  plan?: string[];
  sortBy?: string; // 'popular' | 'newest'
}

export interface CourseListResponse {
  courses: Course[];
  metadata: {
    page: number;
    limit: number;
    total_count: number;
    next_page: number | null;
  };
}

export const SORT_OPTIONS = [
  { id: 'popular',
    label: 'Most Popular'
  },
  { id: 'newest',
    label: 'Newest First'
  },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]; 