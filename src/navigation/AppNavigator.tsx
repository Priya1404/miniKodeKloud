import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { CourseListScreen } from '../screens/CourseListScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import { VideoPlayerScreen } from '../screens/VideoPlayerScreen';
import { TouchableOpacity, Text } from 'react-native';
import { getStateFromPath } from '@react-navigation/native';

export type RootStackParamList = {
  CourseList: undefined;
  CourseDetail: {
     slug: string;
     fromDeeplink?: boolean;
  };
  VideoPlayer: {
    courseId: string;
    lessonId: string;
    completedLessons?: string[];
    setCompletedLessons?: React.Dispatch<React.SetStateAction<string[]>>;
    isPreview?: boolean;
    videoId?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

// Deep-linking config
const linking = {
  prefixes: [
    'kodekloud://',
    'https://kodekloud.com',
    'https://learn.kodekloud.com'
  ],
  config: {
    screens: {
      CourseList: 'courses',
      CourseDetail: {
        path: 'courses/:slug',
        parse: {
          slug: (slug: string) => slug,
        },
      },
      VideoPlayer: 'courses/:slug/lesson/:lessonId',
    },
  },
  getStateFromPath: (path, options) => {
    const state = getStateFromPath(path, options);

    if (state) {
      // Find the course detail route and add the fromDeeplink param
      const courseDetailRoute = state.routes.find(r => r.name === 'CourseDetail');
      if (courseDetailRoute && courseDetailRoute.params) {
        courseDetailRoute.params.fromDeeplink = true;
      }
    }

    return state;
  },
  subscribe(listener: (url: string) => void) {
    // handling deep link when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      subscription?.remove();
    };
  },
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="CourseList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: '#333333',
          },
        }}
      >
        <Stack.Screen
          name="CourseList"
          component={CourseListScreen}
          options={{
            title: 'KodeKloud Courses',
            headerTitleAlign: 'center',
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={({ route, navigation }) => ({
            title: 'Course Details',
            headerTitleAlign: 'center',
            headerLeft: route.params?.fromDeeplink
              ? () => (
                  <TouchableOpacity
                    style={{ marginLeft: 12, padding: 4 }}
                    onPress={() => navigation.navigate('CourseList')}
                  >
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007AFF' }}>‹</Text>
                  </TouchableOpacity>
                )
              : undefined,
          })}
        />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{
            headerShown: false, // hiding header for full screen video experience
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 