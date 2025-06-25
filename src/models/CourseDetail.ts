import { Tutor } from './Tutor';
import { Category } from './Category';

export interface CourseDetailLesson {
  id: string;
  title: string;
  type: string;
  position: number;
  duration?: number;
  openAccess: boolean;
  video_url?: string | null;
}

export interface CourseDetailModule {
  id: string;
  title: string;
  position: number;
  lessonsCount: number;
  lessons: CourseDetailLesson[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  thumbnailVideoUrl: string | null;
  tutors: Tutor[];
  popularity: number;
  difficultyLevel: string;
  categories: Category[];
  plan: string;
  excerpt: string;
  description: string;
  lessonsCount: number;
  userbackId: string;
  hidden: boolean;
  modules: CourseDetailModule[];
  includesSection?: any;
  isEnrolled?: boolean;
} 