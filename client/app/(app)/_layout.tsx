// File: client/app/(app)/_layout.tsx

import { Stack, Tabs } from 'expo-router';
export default () => (
    <Stack>
        <Stack.Screen name="(tabs)" 
            options={{ headerShown: false }}
         />
         <Stack.Screen name="profile"  />
         <Stack.Screen name="group"  />
         <Stack.Screen name="settings"  />
         <Stack.Screen name="about"  />
         <Stack.Screen name="chat"  />
    </Stack>
)