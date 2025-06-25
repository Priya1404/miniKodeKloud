import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Button,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { VideoPlayerService, PlaybackPosition } from '../services/VideoPlayerService';
import PipHandler from 'react-native-pip-android';

interface VimeoVideoPlayerProps {
  videoId: string;
  lessonId: string;
  courseId: string;
  onProgress?: (position: number, duration: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoPlay?: boolean;
  showControls?: boolean;
  onClose?: () => void;
  isOffline?: boolean;
  isDownloaded?: boolean;
  resumePosition?: number;
}

export const VimeoVideoPlayer: React.FC<VimeoVideoPlayerProps> = ({
  videoId,
  lessonId,
  courseId,
  onProgress,
  onComplete,
  onError,
  autoPlay = false,
  showControls = true,
  onClose,
  isDownloaded = false,
  resumePosition,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [savedPosition, setSavedPosition] = useState<PlaybackPosition | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    loadSavedPosition();   // loading saved playback position
  }, [lessonId, courseId]);

  useEffect(() => {
    console.log('[VimeoVideoPlayer] videoId:', videoId, 'Platform:', Platform.OS);
  }, [videoId]);

  const loadSavedPosition = useCallback(async () => {
    try {
      const position = await VideoPlayerService.getPlaybackPosition(lessonId, courseId);
      setSavedPosition(position);
    } catch (error) {
      console.error('Error loading saved position:', error);
    }
  }, [lessonId, courseId]);

  const savePosition = useCallback(async (position: number, videoDuration: number) => {
    try {
      // saving playback position periodically
      await VideoPlayerService.savePlaybackPosition(lessonId, courseId, position, videoDuration);
    } catch (error) {
      console.error('Error saving position:', error);
    }
  }, [lessonId, courseId]);

  // Vimeo Player API JavaScript
  const getVimeoPlayerScript = useCallback(() => {
    const startTime = typeof resumePosition === 'number' ? Math.floor(resumePosition) : (savedPosition ? Math.floor(savedPosition.position) : 0);
    // Always setting autoplay=1 and muted=1 if autoPlay is true, for mobile compatibility
    let embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}&controls=${showControls ? 1 : 0}&start=${startTime}`;
    if (autoPlay) {
      embedUrl += '&muted=1';
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background: transparent; }
            .video-container { 
              position: absolute;
              top: 0;
              left: 0;
              width: 100%; 
              height: 100%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            iframe { 
              width: 100%; 
              height: 100%; 
              border: none; 
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="${embedUrl}"
              frameborder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
          
          <script src="https://player.vimeo.com/api/player.js"></script>
          <script>
            let player;
            let positionUpdateInterval;
            let lastSavedPosition = 0;
            
            // Initialize player when iframe loads
            window.addEventListener('message', function(event) {
              if (event.data && event.data.type === 'vimeo-player-ready') {
                initializePlayer();
              }
            });
            
            function initializePlayer() {
              const iframe = document.querySelector('iframe');
              if (iframe) {
                player = new Vimeo.Player(iframe);
                
                // Set up event listeners
                player.on('loaded', function() {
                  console.log('Video loaded');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loaded',
                    duration: 0
                  }));
                  // Try to force fullscreen and play
                  player.requestFullscreen().then(function() {
                    player.play();
                  }).catch(function(e) {
                    player.play(); // fallback to just play
                  });
                });
                
                player.on('timeupdate', function(data) {
                  const position = data.seconds;
                  const duration = data.duration;
                  
                  // Update position every second
                  if (Math.floor(position) !== Math.floor(lastSavedPosition)) {
                    lastSavedPosition = position;
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'progress',
                      position: position,
                      duration: duration
                    }));
                  }
                });
                
                player.on('ended', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ended'
                  }));
                });
                
                player.on('error', function(error) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    error: error.message
                  }));
                });
                
                // Get initial duration
                player.getDuration().then(function(duration) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'duration',
                    duration: duration
                  }));
                });
              }
            }
            
            // Auto-initialize if player is already available
            if (typeof Vimeo !== 'undefined') {
              setTimeout(initializePlayer, 1000);
            }
          </script>
        </body>
      </html>
    `;
  }, [videoId, autoPlay, showControls, savedPosition, resumePosition]);

  // handling messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'loaded':
          setIsLoading(false);
          break;
          
        case 'duration':
          setDuration(data.duration);
          break;
          
        case 'progress':
          setCurrentPosition(data.position);
          setDuration(data.duration);
          onProgress?.(data.position, data.duration);
          
          // Save position every 10 seconds
          if (Math.floor(data.position) % 10 === 0 && data.position > 0) {
            savePosition(data.position, data.duration);
          }
          break;
          
        case 'ended':
          onComplete?.();
          savePosition(currentPosition, duration);
          break;
          
        case 'error':
          setHasError(true);
          setIsLoading(false);
          onError?.(data.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onProgress, onComplete, onError, savePosition, currentPosition, duration, onClose]);

  // handling WebView errors
  const handleWebViewError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setHasError(true);
    setIsLoading(false);
    console.error('WebView error:', nativeEvent);
    onError?.(nativeEvent.description || 'Video loading failed');
  }, [onError]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  // PiP handler for Android
  const handleEnterPip = () => {
    if (Platform.OS === 'android') {
      PipHandler.enterPipMode(300, 214);
    }
  };

  // Use WebView for both platforms for consistent playback
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {Platform.OS === 'android' && (
        <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <Button title="PiP" onPress={handleEnterPip} color="#007AFF" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: getVimeoPlayerScript() }}
        style={{ flex: 1, backgroundColor: '#000' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={e => {
          setHasError(true);
          if (onError) onError(e.nativeEvent.description);
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Failed to load video.</Text>
        </View>
      )}
      {savedPosition && savedPosition.position > 0 && (
        <View style={styles.resumeOverlay}>
          <Text style={styles.resumeText}>Resume from {Math.floor(savedPosition.position)}s</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  resumeOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 32,
  },
  resumeText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
}); 