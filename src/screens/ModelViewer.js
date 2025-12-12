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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from "../supabase/supabase";

const ModelViewer = ({ route, navigation }) => {
  const { modelUrl, usdzUrl, thumbnailUrl, name, fromHistory } = route.params;

  const [isLoading3D, setIsLoading3D] = useState(true);
  const [isOpeningAR, setIsOpeningAR] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modelName, setModelName] = useState(name || "");
  const [isSaving, setIsSaving] = useState(false);

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
        ${
          modelUrl
            ? `<model-viewer id="mv" src="${modelUrl}" auto-rotate camera-controls ar ar-modes="scene-viewer webxr quick-look"></model-viewer>`
            : `<div style="display:flex; height:100%; justify-content:center; align-items:center; color:#fff; font-size:18px;">No 3D Model</div>`
        }
        <script>
          const mv = document.getElementById("mv");
          if (mv) {
            mv.addEventListener("load", () => {
              window.ReactNativeWebView.postMessage("MODEL_LOADED");
            });
          }
        </script>
      </body>
    </html>
  `;

  const openAR = async () => {
    if (!usdzUrl) {
      Alert.alert("Missing USDZ", "The model does not contain a USDZ file.");
      return;
    }

    setIsOpeningAR(true);

    try {
      // Preload USDZ file in background
      console.log("Preloading USDZ file...");
      const preloadPromise = fetch(usdzUrl).then(response => response.blob());
      
      // Wait for 10 seconds OR until file is loaded (whichever comes first)
      await Promise.race([
        preloadPromise,
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      
      console.log("USDZ preload complete, opening AR viewer...");

      // Now open AR viewer
      if (Platform.OS === "ios") {
        await Linking.openURL(usdzUrl);
      } else {
        const intentUrl =
          `intent://arvr.google.com/scene-viewer/1.0` +
          `?file=${encodeURIComponent(usdzUrl)}` +
          `&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end`;
        await Linking.openURL(intentUrl);
      }
    } catch (err) {
      Alert.alert("Error", "Could not open AR viewer.");
    } finally {
      setIsOpeningAR(false);
    }
  };

  // Background upload function - runs after UI updates
  const uploadFilesInBackground = async (userId, modelName, timestamp, modelUrl, usdzUrl, thumbnailUrl) => {
    const bucketName = 'user-models';
    
    // File paths with user ID as folder
    const glbPath = `${userId}/glb/${modelName.trim()}_${timestamp}.glb`;
    const usdzPath = usdzUrl ? `${userId}/usdz/${modelName.trim()}_${timestamp}.usdz` : null;
    const thumbPath = thumbnailUrl ? `${userId}/thumbnails/${modelName.trim()}_${timestamp}.png` : null;

    try {
      console.log("Background upload starting...");

      // Upload GLB
      const glbResp = await fetch(modelUrl);
      const glbArrayBuffer = await glbResp.arrayBuffer();
      const glbUint8 = new Uint8Array(glbArrayBuffer);
      
      await supabase.storage
        .from(bucketName)
        .upload(glbPath, glbUint8, { upsert: true });
      
      console.log("✓ GLB uploaded");

      // Upload USDZ if exists
      if (usdzUrl && usdzPath) {
        const usdzResp = await fetch(usdzUrl);
        const usdzArrayBuffer = await usdzResp.arrayBuffer();
        const usdzUint8 = new Uint8Array(usdzArrayBuffer);
        
        await supabase.storage
          .from(bucketName)
          .upload(usdzPath, usdzUint8, { upsert: true });
        
        console.log("✓ USDZ uploaded");
      }

      // Upload Thumbnail if exists
      if (thumbnailUrl && thumbPath) {
        const thumbResp = await fetch(thumbnailUrl);
        const thumbArrayBuffer = await thumbResp.arrayBuffer();
        const thumbUint8 = new Uint8Array(thumbArrayBuffer);
        
        await supabase.storage
          .from(bucketName)
          .upload(thumbPath, thumbUint8, { upsert: true });
        
        console.log("✓ Thumbnail uploaded");
      }

      console.log("✓ All files uploaded successfully in background");
      
    } catch (err) {
      console.error("Background upload error:", err);
      // Silently fail - metadata is already saved
    }
  };

  const saveToStorage = async () => {
    if (!modelName.trim()) {
      Alert.alert("Enter a name", "Please enter a valid name for your model.");
      return;
    }

    setIsSaving(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to save models.");
        setIsSaving(false);
        return;
      }

      const userId = user.id;
      const timestamp = Date.now();
      const bucketName = 'user-models';
      
      // File paths
      const glbPath = `${userId}/glb/${modelName.trim()}_${timestamp}.glb`;
      const usdzPath = usdzUrl ? `${userId}/usdz/${modelName.trim()}_${timestamp}.usdz` : null;
      const thumbPath = thumbnailUrl ? `${userId}/thumbnails/${modelName.trim()}_${timestamp}.png` : null;

      // Save metadata to database FIRST (instant)
      console.log("Saving metadata to database...");
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
      
      console.log("✓ Metadata saved instantly");

      // Close modal and show success immediately
      setShowNameModal(false);
      setIsSaving(false);
      
      Alert.alert(
        "Success! 🎉", 
        "Model saved to your collection!\n\nFiles are uploading in the background.",
        [
          { 
            text: "View History", 
            onPress: () => navigation.navigate("MainTabs", {
  screen: "HistoryTab",
})

          },
          { text: "OK" }
        ]
      );

      // Upload files in background (non-blocking)
      uploadFilesInBackground(userId, modelName, timestamp, modelUrl, usdzUrl, thumbnailUrl);
      
    } catch (err) {
      console.error("Save error:", err);
      setIsSaving(false);
      Alert.alert(
        "Error", 
        `Failed to save model.\n\nDetails: ${err.message}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>3D Model</Text>
          {name && <Text style={styles.headerSubtitle}>{name}</Text>}
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
          {!fromHistory && (
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
          )}

          <TouchableOpacity
            style={fromHistory ? styles.actionButtonFull : styles.actionButtonHalf}
            onPress={() => navigation.navigate("QRScreen", { usdzUrl })}
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

        {usdzUrl && (
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
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveToStorage}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={isSaving ? ['#666', '#444'] : ['#9b5cff', '#6a25f4']}
                  style={styles.saveButtonGradient}
                >
                  {isSaving ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.saveButtonText}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="white" />
                      <Text style={styles.saveButtonText}>Save Model</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ModelViewer;

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
  viewerWrapper: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  viewerCard: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,6,20,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 32, paddingHorizontal: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  loadingText: { fontSize: 18, fontWeight: '700', color: 'white', marginTop: 16 },
  loadingSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  controlsHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  controlsText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  actionContainer: { paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButtonHalf: { flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  actionButtonFull: { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '700', color: 'white', letterSpacing: 0.2 },
  buttonTextLarge: { fontSize: 17, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
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