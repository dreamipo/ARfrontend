import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "./src/screens/HomeScreen";
import ModelViewer from "./src/screens/ModelViewer";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import QRScreen from "./src/screens/QRScreen";
import QRScanner from "./src/screens/QRScanner";
import USDZViewer from "./src/screens/USDZViewer";
import MiniModelViewer from "./src/screens/MiniModelViewer";
import ProfileScreen from "./src/screens/ProfileScreen";
import SignupScreen from "./src/screens/Signup";
import LoginScreen from "./src/screens/Login";
import TestModelViewer from "./src/screens/TestModelViewer";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// -------------------------
// BOTTOM TAB NAVIGATION
// -------------------------
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "gray",

        // 🔥 ADD THIS
        tabBarStyle: {
          backgroundColor: "#161022",
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="QRScannerTab"
        component={QRScanner}
        options={{
          tabBarLabel: "Scan",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}


// -------------------------
// ROOT NAVIGATION
// -------------------------
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
         <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
         <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
       
         <Stack.Screen name="SignUp" component={SignupScreen} />
         
       
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
       
        

        {/* MAIN TABS */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* OTHER NON-TAB SCREENS */}
        <Stack.Screen name="ModelViewer" component={ModelViewer} />
        <Stack.Screen name="USDZViewer" component={USDZViewer} />
        <Stack.Screen name="MiniModelViewer" component={MiniModelViewer} />
        <Stack.Screen name="QRScreen" component={QRScreen} />
        <Stack.Screen name="TestModelViewer" component={TestModelViewer}options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>

  );
}
