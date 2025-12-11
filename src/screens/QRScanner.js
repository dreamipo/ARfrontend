import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Dimensions, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function QRScanner({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanningActive, setScanningActive] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Scanning pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Corner animation
    const cornerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    cornerLoop.start();

    return () => {
      pulseLoop.stop();
      cornerLoop.stop();
    };
  }, []);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="qrcode-scan" size={60} color="#9b5cff" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        
        <Animated.View 
          style={[
            styles.permissionContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.permissionIconCircle}>
            <MaterialCommunityIcons name="camera-outline" size={50} color="#9b5cff" />
          </View>

          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need camera permission to scan QR codes{"\n"}and unlock AR experiences
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#10b981" />
              <Text style={styles.featureText}>Scan QR codes instantly</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="cube-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>View 3D models in AR</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#10b981" />
              <Text style={styles.featureText}>Your privacy is protected</Text>
            </View>
          </View>

          <TouchableOpacity onPress={requestPermission} activeOpacity={0.8}>
            <LinearGradient
              colors={['#9b5cff', '#6a25f4']}
              style={styles.permissionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="camera" size={22} color="white" />
              <Text style={styles.permissionBtnText}>Allow Camera Access</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const handleScan = ({ data }) => {
    if (scanned || !scanningActive) return;
    setScanned(true);
    setScanningActive(false);

    try {
      let usdzUrl = null;

      // JSON QR with usdz/model URL
      if (data.trim().startsWith("{")) {
        const parsed = JSON.parse(data);
        usdzUrl = parsed.usdzUrl || parsed.modelUrl || null;
      }

      // Direct URL
      if (!usdzUrl && (data.startsWith("http://") || data.startsWith("https://"))) {
        usdzUrl = data.trim();
      }

      if (!usdzUrl) {
        Alert.alert("Invalid QR Code", "This QR code doesn't contain a valid model URL.");
        setScanned(false);
        setScanningActive(true);
        return;
      }

      // Success feedback
      Alert.alert(
        "QR Code Detected! 🎉",
        "Opening your 3D model...",
        [
          {
            text: "View Model",
            onPress: () => navigation.navigate("USDZViewer", { usdzUrl })
          }
        ]
      );

    } catch (err) {
      Alert.alert("Scan Error", "Could not read this QR code. Please try again.");
      setScanned(false);
      setScanningActive(true);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScanningActive(true);
  };

  const cornerOpacity = cornerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundOrb1} />
      <View style={styles.backgroundOrb2} />

      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QR Code Scanner</Text>
          </View>
          <TouchableOpacity 
            style={styles.infoBtn} 
            onPress={() => Alert.alert(
              "How to Scan",
              "Point your camera at a QR code to instantly view 3D models in AR. Make sure the QR code is well-lit and clearly visible."
            )}
          >
            <MaterialCommunityIcons name="information-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <MaterialCommunityIcons name="qrcode" size={24} color="#9b5cff" />
          <Text style={styles.instructionsText}>
            Position the QR code within the frame
          </Text>
        </View>

        {/* Camera Box */}
        <Animated.View 
          style={[
            styles.cameraWrapper,
            { transform: [{ scale: scanningActive ? pulseAnim : 1 }] }
          ]}
        >
          <View style={styles.cameraBox}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanningActive ? handleScan : undefined}
            />

            {/* Scanning Overlay */}
            <View style={styles.scanOverlay}>
              {/* Animated Corners */}
              <Animated.View style={[styles.corner, styles.topLeft, { opacity: cornerOpacity }]} />
              <Animated.View style={[styles.corner, styles.topRight, { opacity: cornerOpacity }]} />
              <Animated.View style={[styles.corner, styles.bottomLeft, { opacity: cornerOpacity }]} />
              <Animated.View style={[styles.corner, styles.bottomRight, { opacity: cornerOpacity }]} />

              {/* Center Target */}
              <View style={styles.targetBox}>
                <View style={styles.targetInner} />
              </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, scanned && styles.statusDotInactive]} />
              <Text style={styles.statusText}>
                {scanned ? "Scanned" : "Scanning..."}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Button */}
        {scanned && (
          <TouchableOpacity onPress={handleScanAgain} activeOpacity={0.8}>
            <LinearGradient
              colors={['#9b5cff', '#6a25f4']}
              style={styles.scanAgainBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={22} color="white" />
              <Text style={styles.scanAgainText}>Scan Another Code</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Scanning Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-on" size={16} color="#fbbf24" />
              <Text style={styles.tipText}>Ensure good lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="fit-to-screen" size={16} color="#fbbf24" />
              <Text style={styles.tipText}>Keep QR code in frame</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="hand-back-right" size={16} color="#fbbf24" />
              <Text style={styles.tipText}>Hold steady for best results</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0a0614" 
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  permissionIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    borderWidth: 2,
    borderColor: "rgba(155, 92, 255, 0.3)",
  },
  permissionTitle: {
    fontSize: 26,
    color: "white",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  permissionSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  featuresList: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    flex: 1,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 10,
    width: width - 60,
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  permissionBtnText: {
    color: "white",
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "500",
    marginBottom: 4,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(155, 92, 255, 0.3)",
  },
  instructionsText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "600",
    flex: 1,
  },
  cameraWrapper: {
    marginBottom: 20,
  },
  cameraBox: {
    height: width * 0.95,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 50,
    height: 50,
    borderColor: "#9b5cff",
  },
  topLeft: {
    top: 30,
    left: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 30,
    right: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 30,
    left: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 30,
    right: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  targetBox: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: "rgba(155, 92, 255, 0.4)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  targetInner: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: "rgba(155, 92, 255, 0.6)",
    borderRadius: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  statusDotInactive: {
    backgroundColor: "#6b7280",
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "600",
  },
  scanAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 20,
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanAgainText: {
    color: "white",
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tipsCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tipsTitle: {
    fontSize: 15,
    color: "white",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700",
    marginBottom: 12,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    flex: 1,
  },
});