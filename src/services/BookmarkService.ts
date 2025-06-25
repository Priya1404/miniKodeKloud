import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const BOOKMARKS_KEY = 'bookmarked_courses';

export class BookmarkService {
  // To get all bookmarked course IDs
  static async getBookmarkedCourseIds(): Promise<string[]> {
    try {
      const bookmarkedIds = storage.getString(BOOKMARKS_KEY);
      return bookmarkedIds ? JSON.parse(bookmarkedIds) : [];
    } catch (error) {
      console.error('Error getting bookmarked courses:', error);
      return [];
    }
  }

  // To check if a course is bookmarked
  static async isBookmarked(courseId: string): Promise<boolean> {
    const bookmarkedIds = await this.getBookmarkedCourseIds();
    return bookmarkedIds.includes(courseId);
  }

  // To add a course to bookmarks
  static async addBookmark(courseId: string): Promise<void> {
    try {
      const bookmarkedIds = await this.getBookmarkedCourseIds();
      if (!bookmarkedIds.includes(courseId)) {
        const newBookmarks = [...bookmarkedIds, courseId];
        storage.set(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }

  // To remove a course from bookmarks
  static async removeBookmark(courseId: string): Promise<void> {
    try {
      const bookmarkedIds = await this.getBookmarkedCourseIds();
      const newBookmarks = bookmarkedIds.filter(id => id !== courseId);
      storage.set(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }
} 