import { DeepLinkService } from '../services/DeepLinkService';

describe('DeepLinkService', () => {
  describe('parseDeepLink', () => {
    it('should parse course deep link correctly', () => {
      const url = 'kodekloud://courses/123';
      const result = DeepLinkService.parseDeepLink(url);
      
      expect(result).toEqual({
        type: 'courses',
        courseId: '123',
      });
    });

    it('should parse lesson deep link correctly', () => {
      const url = 'kodekloud://courses/123/lesson/4';
      const result = DeepLinkService.parseDeepLink(url);
      
      expect(result).toEqual({
        type: 'lesson',
        courseId: '123',
        lessonId: '4',
      });
    });

    it('should return null for invalid URL format', () => {
      const url = 'invalid://url';
      const result = DeepLinkService.parseDeepLink(url);
      
      expect(result).toBeNull();
    });

    it('should return null for empty URL', () => {
      const url = '';
      const result = DeepLinkService.parseDeepLink(url);
      
      expect(result).toBeNull();
    });
  });
}); 