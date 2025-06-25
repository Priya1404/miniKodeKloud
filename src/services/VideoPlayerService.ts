import { MMKV } from 'react-native-mmkv';

let storage: MMKV = new MMKV();

export interface PlaybackPosition {
  lessonId: string;
  courseId: string;
  position: number; // in seconds
  duration: number; // in seconds
  lastUpdated: string;
}

export class VideoPlayerService {
  private static readonly POSITION_KEY = 'video_playback_positions';

  static setStorage(customStorage: MMKV) {
    storage = customStorage;
  }

  // To save playback position for a lesson
  static async savePlaybackPosition(
    lessonId: string,
    courseId: string,
    position: number,
    duration: number
  ): Promise<void> {
    try {
      const positions = this.getPlaybackPositions();
      const key = `${courseId}_${lessonId}`;
      
      positions[key] = {
        lessonId,
        courseId,
        position,
        duration,
        lastUpdated: new Date().toISOString(),
      };
      
      storage.set(this.POSITION_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving playback position:', error);
    }
  }

  // To get playback position for a lesson
  static async getPlaybackPosition(lessonId: string, courseId: string): Promise<PlaybackPosition | null> {
    try {
      const positions = this.getPlaybackPositions();
      const key = `${courseId}_${lessonId}`;
      return positions[key] || null;
    } catch (error) {
      console.error('Error getting playback position:', error);
      return null;
    }
  }

  // To get all playback positions for a course
  static async getCoursePlaybackPositions(courseId: string): Promise<PlaybackPosition[]> {
    try {
      const positions = this.getPlaybackPositions();
      return Object.values(positions).filter(pos => pos.courseId === courseId);
    } catch (error) {
      console.error('Error getting course playback positions:', error);
      return [];
    }
  }

  // To clear playback position for a lesson
  static async clearPlaybackPosition(lessonId: string, courseId: string): Promise<void> {
    try {
      const positions = this.getPlaybackPositions();
      const key = `${courseId}_${lessonId}`;
      
      if (positions[key]) {
        delete positions[key];
        storage.set(this.POSITION_KEY, JSON.stringify(positions));
      }
    } catch (error) {
      console.error('Error clearing playback position:', error);
    }
  }

  // To clear all playback positions for a course
  static async clearCoursePlaybackPositions(courseId: string): Promise<void> {
    try {
      const positions = this.getPlaybackPositions();
      const filteredPositions = Object.fromEntries(
        Object.entries(positions).filter(([_, pos]) => pos.courseId !== courseId)
      );
      storage.set(this.POSITION_KEY, JSON.stringify(filteredPositions));
    } catch (error) {
      console.error('Error clearing course playback positions:', error);
    }
  }

  // To get total watch time for a course
  static async getCourseWatchTime(courseId: string): Promise<number> {
    try {
      const positions = await this.getCoursePlaybackPositions(courseId);
      return positions.reduce((total, pos) => total + pos.position, 0);
    } catch (error) {
      console.error('Error getting course watch time:', error);
      return 0;
    }
  }

  // To check if user has watched a lesson (watched more than 90% of the video)
  static async hasWatchedLesson(lessonId: string, courseId: string): Promise<boolean> {
    try {
      const position = await this.getPlaybackPosition(lessonId, courseId);
      if (!position || position.duration === 0) return false;
      
      const watchPercentage = (position.position / position.duration) * 100;
      return watchPercentage >= 90;
    } catch (error) {
      console.error('Error checking lesson watch status:', error);
      return false;
    }
  }

  // To get last watched lesson for a course
  static async getLastWatchedLesson(courseId: string): Promise<PlaybackPosition | null> {
    try {
      const positions = await this.getCoursePlaybackPositions(courseId);
      if (positions.length === 0) return null;
      
      return positions.reduce((latest, current) => {
        const latestDate = new Date(latest.lastUpdated);
        const currentDate = new Date(current.lastUpdated);
        return currentDate > latestDate ? current : latest;
      });
    } catch (error) {
      console.error('Error getting last watched lesson:', error);
      return null;
    }
  }

  private static getPlaybackPositions(): Record<string, PlaybackPosition> {
    try {
      const data = storage.getString(this.POSITION_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting playback positions:', error);
      return {};
    }
  }
} 