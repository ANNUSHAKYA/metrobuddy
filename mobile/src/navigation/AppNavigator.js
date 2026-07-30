import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import JourneyCreationScreen from '../screens/main/JourneyCreationScreen';
import MatchingStatusScreen from '../screens/main/MatchingStatusScreen';
import ChatScreen from '../screens/main/ChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        ) : !user?.anonymousHandle ? (
          // Profile Setup (Authenticated but no handle)
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          // Main Stack
          <>
            <Stack.Screen name="JourneyCreation" component={JourneyCreationScreen} />
            <Stack.Screen name="MatchingStatus" component={MatchingStatusScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

