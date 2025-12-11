import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from "../supabase/supabase";

const TestModelViewer = ({ navigation }) => {
  // Sample 3D model URLs (Free CDN hosted models)
  const SAMPLE_MODELS = [
    {
      name: "Astronaut",
      glb: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
      usdz: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
      thumbnail: "https://modelviewer.dev/assets/poster-astronaut.png"
    },
    {
      name: "Damaged Helmet",
      glb: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
      usdz: null, // No USDZ for this one
      thumbnail: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/screenshot/screenshot.png"
    },
    {
      name: "Robot Expressive",
      glb: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
      usdz: null,
      thumbnail: "https://modelviewer.dev/assets/poster-robot.png"
    }
  ];

  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading3D, setIsLoading3D] = useState(true);
  const [isOpeningAR, setIsOpeningAR] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modelName, setModelName] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(true);

  const htmlContent = selectedModel ? `
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
          src="${selectedModel.glb}" 
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
  ` : '';

  const openAR = async () => {
    if (!selectedModel?.usdz) {
      Alert.alert("Missing USDZ", "This model does not have a USDZ file for AR.");
      return;
    }

    setIsOpeningAR(true);

    try {
      if (Platform.OS === "ios") {
        await Linking.openURL(selectedModel.usdz);
      } else {
        const intentUrl =
          `intent://arvr.google.com/scene-viewer/1.0` +
          `?file=${encodeURIComponent(selectedModel.usdz)}` +
          `&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end`;
        await Linking.openURL(intentUrl);
      }
    } catch (err) {
      Alert.alert("Error", "Could not open AR viewer.");
    } finally {
      setIsOpeningAR(false);
    }
  };

  const saveToStorage = async () => {
    if (!modelName.trim()) {
      Alert.alert("Enter a name", "Please enter a valid name for your model.");
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to save models.");
        return;
      }

      const userId = user.id;
      const timestamp = Date.now();
      const bucketName = 'user-models';
      
      // File paths with user ID as folder
      const glbPath = `${userId}/glb/${modelName.trim()}_${timestamp}.glb`;
      const usdzPath = selectedModel.usdz ? `${userId}/usdz/${modelName.trim()}_${timestamp}.usdz` : null;
      const thumbPath = selectedModel.thumbnail ? `${userId}/thumbnails/${modelName.trim()}_${timestamp}.png` : null;

      console.log("Starting upload...");
      console.log("User ID:", userId);
      console.log("Bucket:", bucketName);

      // ---- Upload GLB ----
      console.log("Fetching GLB from:", selectedModel.glb);
      const glbResp = await fetch(selectedModel.glb);
      if (!glbResp.ok) throw new Error("Failed to fetch GLB");
      
      const glbArrayBuffer = await glbResp.arrayBuffer();
      const glbUint8 = new Uint8Array(glbArrayBuffer);
      console.log("GLB size:", glbUint8.length, "bytes");

      console.log("Uploading GLB to:", glbPath);
      const { error: glbError } = await supabase.storage
        .from(bucketName)
        .upload(glbPath, glbUint8, { upsert: true });
      
      if (glbError) {
        console.error("GLB upload error:", glbError);
        throw glbError;
      }
      console.log("✓ GLB uploaded successfully");

      // ---- Upload USDZ ----
      if (selectedModel.usdz && usdzPath) {
        console.log("Fetching USDZ from:", selectedModel.usdz);
        const usdzResp = await fetch(selectedModel.usdz);
        if (!usdzResp.ok) throw new Error("Failed to fetch USDZ");
        
        const usdzArrayBuffer = await usdzResp.arrayBuffer();
        const usdzUint8 = new Uint8Array(usdzArrayBuffer);
        console.log("USDZ size:", usdzUint8.length, "bytes");

        console.log("Uploading USDZ to:", usdzPath);
        const { error: usdzError } = await supabase.storage
          .from(bucketName)
          .upload(usdzPath, usdzUint8, { upsert: true });
        
        if (usdzError) {
          console.error("USDZ upload error:", usdzError);
          throw usdzError;
        }
        console.log("✓ USDZ uploaded successfully");
      }

      // ---- Upload Thumbnail ----
      if (selectedModel.thumbnail && thumbPath) {
        console.log("Fetching thumbnail from:", selectedModel.thumbnail);
        const thumbResp = await fetch(selectedModel.thumbnail);
        if (!thumbResp.ok) throw new Error("Failed to fetch Thumbnail");
        
        const thumbArrayBuffer = await thumbResp.arrayBuffer();
        const thumbUint8 = new Uint8Array(thumbArrayBuffer);
        console.log("Thumbnail size:", thumbUint8.length, "bytes");

        console.log("Uploading thumbnail to:", thumbPath);
        const { error: thumbError } = await supabase.storage
          .from(bucketName)
          .upload(thumbPath, thumbUint8, { upsert: true });
        
        if (thumbError) {
          console.error("Thumbnail upload error:", thumbError);
          throw thumbError;
        }
        console.log("✓ Thumbnail uploaded successfully");
      }

      // ---- Save metadata to database ----
      console.log("Saving to database...");
      const { error: dbError } = await supabase
        .from('user_models')
        .insert({
          user_id: userId,
          name: modelName.trim(),
          glb_path: glbPath,
          usdz_path: usdzPath,
          thumbnail_path: thumbPath,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }
      console.log("✓ Metadata saved to database");

      Alert.alert(
        "Success! 🎉", 
        "Model saved to your collection!\n\nCheck the History tab to see it.",
        [
          { 
            text: "View History", 
            onPress: () => navigation.navigate("HistoryTab") 
          },
          { text: "OK" }
        ]
      );
      setShowNameModal(false);
      
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert(
        "Error", 
        `Failed to save model.\n\nDetails: ${err.message}\n\nCheck console for more info.`
      );
    }
  };

  // Model Selector Screen
  if (showModelSelector) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Test 3D Models</Text>
            <Text style={styles.headerSubtitle}>Select a sample model</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.modelList}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information" size={24} color="#9b5cff" />
            <Text style={styles.infoText}>
              These are sample 3D models for testing the save functionality.
              No Tripo credits needed! 🎉
            </Text>
          </View>

          {SAMPLE_MODELS.map((model, index) => (
            <TouchableOpacity
              key={index}
              style={styles.modelCard}
              onPress={() => {
                setSelectedModel(model);
                setModelName(model.name);
                setShowModelSelector(false);
                setIsLoading3D(true);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(155, 92, 255, 0.2)', 'rgba(106, 37, 244, 0.1)']}
                style={styles.modelCardGradient}
              >
                <View style={styles.modelCardIcon}>
                  <MaterialCommunityIcons name="cube-outline" size={32} color="#9b5cff" />
                </View>
                
                <View style={styles.modelCardContent}>
                  <Text style={styles.modelCardTitle}>{model.name}</Text>
                  
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <MaterialCommunityIcons name="file-3d" size={12} color="#6366f1" />
                      <Text style={styles.badgeText}>GLB</Text>
                    </View>
                    {model.usdz && (
                      <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                        <MaterialCommunityIcons name="rotate-3d-variant" size={12} color="#10b981" />
                        <Text style={[styles.badgeText, { color: '#10b981' }]}>AR Ready</Text>
                      </View>
                    )}
                  </View>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Model Viewer Screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setShowModelSelector(true)} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>3D Model</Text>
          <Text style={styles.headerSubtitle}>{selectedModel?.name}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => Alert.alert("Controls", "• Drag to rotate\n• Pinch to zoom\n• Two fingers to pan")}
          >
            <MaterialCommunityIcons name="information-outline" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Viewer */}
      <View style={styles.viewerWrapper}>
        <View style={styles.viewerCard}>
          {isLoading3D && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#9b5cff" />
                <Text style={styles.loadingText}>Loading Model...</Text>
                <Text style={styles.loadingSubtext}>This may take a moment</Text>
              </View>
            </View>
          )}

          {isOpeningAR && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Opening AR View...</Text>
                <Text style={styles.loadingSubtext}>Preparing immersive experience</Text>
              </View>
            </View>
          )}

          <WebView
            source={{ html: htmlContent }}
            style={styles.webview}
            originWhitelist={['*']}
            mixedContentMode="always"
            onMessage={(event) => {
              if (event.nativeEvent.data === "MODEL_LOADED") setIsLoading3D(false);
            }}
          />
        </View>

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
            onPress={() => setShowNameModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9b5cff', '#6a25f4']}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="content-save" size={22} color="white" />
              <Text style={styles.buttonText}>Save</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonHalf}
            onPress={() => navigation.navigate("QRScreen", { usdzUrl: selectedModel?.usdz })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="qrcode" size={22} color="white" />
              <Text style={styles.buttonText}>Share QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {selectedModel?.usdz && (
          <TouchableOpacity
            style={styles.actionButtonFull}
            onPress={openAR}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="cube-scan" size={24} color="white" />
              <Text style={styles.buttonTextLarge}>View in AR</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Save Modal */}
      <Modal 
        visible={showNameModal} 
        transparent 
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <MaterialCommunityIcons name="content-save" size={28} color="#9b5cff" />
              </View>
              <Text style={styles.modalTitle}>Save to Collection</Text>
              <Text style={styles.modalSubtitle}>Give your 3D model a name</Text>
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons 
                name="tag-outline" 
                size={20} 
                color="rgba(255,255,255,0.4)" 
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Enter model name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={styles.input}
                value={modelName}
                onChangeText={setModelName}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowNameModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveToStorage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9b5cff', '#6a25f4']}
                  style={styles.saveButtonGradient}
                >
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Model</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TestModelViewer;

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0614' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, zIndex: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'white', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerRight: { width: 44 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  
  // Model List Styles
  modelList: { padding: 20, paddingTop: 10 },
  infoCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(155, 92, 255, 0.1)', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.3)',
    gap: 12
  },
  infoText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  modelCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  modelCardGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.3)',
  },
  modelCardIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: 'rgba(155, 92, 255, 0.2)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 16
  },
  modelCardContent: { flex: 1 },
  modelCardTitle: { fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 8 },
  badgeContainer: { flexDirection: 'row', gap: 8 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(99, 102, 241, 0.2)', 
    borderRadius: 8, 
    paddingHorizontal: 8, 
    paddingVertical: 4,
    gap: 4
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#6366f1' },

  // Viewer Styles
  viewerWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  viewerCard: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,6,20,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 32, paddingHorizontal: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  loadingText: { fontSize: 18, fontWeight: '700', color: 'white', marginTop: 16 },
  loadingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  controlsHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  controlsText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  
  // Action Button Styles
  actionContainer: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButtonHalf: { flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  actionButtonFull: { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '700', color: 'white', letterSpacing: 0.2 },
  buttonTextLarge: { fontSize: 17, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(20,15,30,0.98)', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(155,92,255,0.3)' },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(155,92,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(155,92,255,0.3)' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 6, letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 54, fontSize: 16, color: 'white', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  saveButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.2 },
});