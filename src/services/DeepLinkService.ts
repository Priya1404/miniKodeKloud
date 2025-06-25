import { Linking } from 'react-native';

export interface DeepLinkData {
  type: 'courses' | 'lesson';
  courseId: string;
  lessonId?: string;
}

export class DeepLinkService {
  // To parse a deep link URL and extract course/lesson information
  static parseDeepLink(url: string): DeepLinkData | null {
    try {
      // handle kodekloud:// URLs
      if (url.startsWith('kodekloud://')) {
        return this.parseKodeKloudUrl(url);
      }

      // handle kodekloud.com and learn.kodekloud.com URLs
      if (url.startsWith('https://kodekloud.com') || url.startsWith('https://learn.kodekloud.com')) {
        return this.parseWebUrl(url);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /* To parse kodekloud:// URLs
   * Examples:
   * - kodekloud://courses/crash-course-docker-for-absolute-beginner
   */
  private static parseKodeKloudUrl(url: string): DeepLinkData | null {
    const path = url.replace('kodekloud://', '');
    return this.parsePath(path);
  }
  
  private static parseWebUrl(url: string): DeepLinkData | null {
    const path = new URL(url).pathname;
    return this.parsePath(path);
  }

  private static parsePath(path: string): DeepLinkData | null {
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0 || parts[0] !== 'courses') {
      return null;
    }

    const courseId = parts[1];
    if (!courseId) {
      return null;
    }

    const lessonIndex = parts.indexOf('lesson');
    if (lessonIndex !== -1 && lessonIndex + 1 < parts.length) {
      const lessonId = parts[lessonIndex + 1];
      return {
        type: 'lesson',
        courseId,
        lessonId,
      };
    }

    return {
      type: 'courses',
      courseId,
    };
  }

  // To open a deep link URL
  static async openDeepLink(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error opening deep link:', error);
      return false;
    }
  }
} 