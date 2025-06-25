export interface LearningPathCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string;
  thumbnail_video_url: string | null;
  lessons_count: number;
  position: number;
}

export interface LearningPathStep {
  id: string;
  title: string;
  description: string | null;
  test_quiz_id: string | null;
  position: number;
  courses: LearningPathCourse[];
}

export interface LearningPath {
  id: string;
  title: string;
  steps: LearningPathStep[];
  thumbnail_url: string;
  icon_url: string;
  slug: string;
  category: string;
} 