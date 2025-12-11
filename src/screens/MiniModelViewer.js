import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MiniModelViewer({ route, navigation }) {
  const { modelUrl, usdzUrl } = route.params;

  const [isLoading3D, setIsLoading3D] = useState(true);
  const [isOpeningAR, setIsOpeningAR] = useState(false);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; background: #0a0614; }
          model-viewer { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <model-viewer
          id="mv"
          src="${modelUrl}"
          auto-rotate
          camera-controls
          ar
          ar-modes="scene-viewer webxr quick-look"
        ></model-viewer>

        <script>
          const mv = document.getElementById("mv");
          mv.addEventListener("load", () => {
            window.ReactNativeWebView.postMessage("MODEL_LOADED");
          });
        </script>
      </body>
    </html>
  `;

  const openAR = async () => {
    if (!usdzUrl) {
      Alert.alert("No USDZ", "USDZ file is missing for AR view.");
      return;
    }

    setIsOpeningAR(true);

    try {
      if (Platform.OS === "ios") {
        await Linking.openURL(usdzUrl);
      } else {
        const intentUrl =
          `intent://arvr.google.com/scene-viewer/1.0` +
          `?file=${encodeURIComponent(usdzUrl)}` +
          `&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end`;
        await Linking.openURL(intentUrl);
      }
      setIsOpeningAR(false);
    } catch (e) {
      setIsOpeningAR(false);
      Alert.alert("Error", "Unable to open AR view.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quick View</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Interactive</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => Alert.alert(
            "Controls", 
            "• Drag to rotate model\n• Pinch to zoom in/out\n• Two fingers to pan"
          )}
        >
          <MaterialCommunityIcons name="information-outline" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* 3D Viewer Container */}
      <View style={styles.viewerWrapper}>
        <View style={styles.viewerCard}>
          {/* Loading Overlay */}
          {isLoading3D && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#9b5cff" />
                <Text style={styles.loadingText}>Loading 3D Model...</Text>
                <Text style={styles.loadingSubtext}>Please wait</Text>
              </View>
            </View>
          )}

          {/* AR Loading Overlay */}
          {isOpeningAR && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Opening AR View...</Text>
                <Text style={styles.loadingSubtext}>Preparing experience</Text>
              </View>
            </View>
          )}

          <WebView
            source={{ html: htmlContent }}
            style={styles.webview}
            originWhitelist={["*"]}
            mixedContentMode="always"
            onMessage={(e) => {
              if (e.nativeEvent.data === "MODEL_LOADED") {
                setIsLoading3D(false);
              }
            }}
          />
        </View>

        {/* Controls Hint */}
        {!isLoading3D && (
          <View style={styles.controlsHint}>
            <MaterialCommunityIcons name="gesture-swipe" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.controlsText}>Drag to rotate • Pinch to zoom</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButtonHalf}
            onPress={() => navigation.navigate("QRScreen", { usdzUrl })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="qrcode" size={22} color="white" />
              <Text style={styles.buttonText}>Share QR</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonHalf}
            onPress={openAR}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="cube-scan" size={22} color="white" />
              <Text style={styles.buttonText}>View AR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0614' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  viewerCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 6, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  controlsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  controlsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonHalf: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
});