import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modelOpacity = useRef(new Animated.Value(0)).current;

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || Platform.OS === 'ios') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  const modelUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    "https://eepqytijpdiejpmjmkda.supabase.co/storage/v1/object/public/3dmodels/models/glb/gamecube_logo.glb"
  )}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
      <style>
        body { 
          margin: 0; 
          background: #000000 !important;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        model-viewer { 
          width: 100%; 
          height: 100%;
          background-color: #000000 !important;
        }
        model-viewer::part(default-ar-button) {
          display: none;
        }
      </style>
    </head>
    <body>
      <model-viewer
        id="viewer"
        src="${modelUrl}"
        alt="3D Model"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="25deg"
        camera-controls
        shadow-intensity="1.5"
        exposure="1.3"
        interaction-prompt="none"
        loading="eager"
      ></model-viewer>
    </body>
  </html>
  `;

  const features = [
    { icon: "camera-plus", text: "Photo to 3D" },
    { icon: "rotate-3d-variant", text: "Interactive Models" },
    { icon: "augmented-reality", text: "AR Experience" },
  ];

  if (!fontsLoaded && Platform.OS === 'android') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.innerContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Logo */}
          <View style={styles.topSection}>
            <LinearGradient 
              colors={["#9b5cff", "#6a25f4"]} 
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="cube-outline" size={40} color="white" />
            </LinearGradient>

            {/* Title & Subtitle */}
            <Text style={styles.title}>3D & AR Creator</Text>
            <Text style={styles.subtitle}>
              Transform your photos into stunning{"\n"}interactive 3D and AR experiences
            </Text>

            {/* Feature Pills */}
            <View style={styles.featureContainer}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featurePill}>
                  <MaterialCommunityIcons 
                    name={feature.icon} 
                    size={16} 
                    color="#9b5cff" 
                  />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 3D Model Viewer */}
          <View style={styles.heroWrapper}>
            <Animated.View style={{ flex: 1, opacity: modelOpacity }}>
              <WebView
                originWhitelist={["*"]}
                source={{ html: htmlContent }}
                style={{ backgroundColor: "transparent", flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onLoadEnd={() => {
                  Animated.timing(modelOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                  }).start();
                }}
              />
            </Animated.View>
          </View>

          {/* Get Started Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={() => navigation.replace("SignUp")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#9b5cff", "#6a25f4"]}
                style={styles.getStartedBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.termsText}>
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#0a0614" 
  },
  container: { 
    flex: 1, 
    backgroundColor: "#0a0614"
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
  },
  logoContainer: {
    height: 75,
    width: 75,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { 
    fontSize: 38, 
    color: "white", 
    fontFamily: Platform.OS === 'ios' ? 'System' : "Inter_800ExtraBold",
    fontWeight: Platform.OS === 'ios' ? '800' : undefined,
    textAlign: "center", 
    marginTop: 24,
    letterSpacing: -1.2,
  },
  subtitle: { 
    fontSize: 16, 
    color: "rgba(255,255,255,0.7)", 
    textAlign: "center", 
    marginTop: 14,
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : "Inter_400Regular",
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    letterSpacing: -0.2,
  },
  featureContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(155, 92, 255, 0.3)",
    gap: 7,
  },
  featureText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : "Inter_600SemiBold",
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
    letterSpacing: -0.1,
  },
  heroWrapper: {
    width: "100%",
    height: width * 0.85,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    paddingBottom: 50,
  },
  bottomSection: {
    alignItems: "center",
    gap: 16,
  },
  getStartedBtn: {
    height: 58,
    width: width - 58,
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  getStartedText: { 
    color: "white", 
    fontSize: 17, 
    fontFamily: Platform.OS === 'ios' ? 'System' : "Inter_700Bold",
    fontWeight: Platform.OS === 'ios' ? '700' : undefined,
    letterSpacing: -0.3,
  },
  termsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : "Inter_400Regular",
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    letterSpacing: -0.1,
  },
});