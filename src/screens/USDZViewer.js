import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../supabase/supabase";

export default function USDZViewer({ route, navigation }) {
  const { usdzUrl } = route.params;

  const [isOpeningAR, setIsOpeningAR] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modelName, setModelName] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  if (!usdzUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Invalid URL</Text>
          <Text style={styles.errorText}>Unable to load AR model</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const checkFileAvailability = async (url, maxAttempts = 5) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.log(`Attempt ${i + 1} failed, retrying...`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between attempts
    }
    return false;
  };

  const openAR = async () => {
    setIsOpeningAR(true);
    setDownloadProgress(0);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      // Check if file is available
      const isAvailable = await checkFileAvailability(usdzUrl);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (!isAvailable) {
        Alert.alert(
          "Download Error", 
          "The AR file is not ready yet. Please try again in a moment.",
          [{ text: "OK" }]
        );
        setIsOpeningAR(false);
        return;
      }

      // Add a small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Open AR viewer
      const canOpen = await Linking.canOpenURL(usdzUrl);
      if (canOpen) {
        await Linking.openURL(usdzUrl);
      } else {
        Alert.alert(
          "AR Not Supported", 
          "Your device doesn't support AR viewing. Please ensure you're using an iOS device with AR capabilities."
        );
      }
    } catch (err) {
      console.error("AR Error:", err);
      Alert.alert(
        "Error", 
        "Failed to open AR viewer. Please ensure the file is fully downloaded and try again."
      );
    } finally {
      setIsOpeningAR(false);
      setDownloadProgress(0);
    }
  };

  const saveToHistory = async () => {
    if (!modelName.trim()) {
      Alert.alert("Name Required", "Please enter a valid model name.");
      return;
    }

    const { error } = await supabase.from("history").insert([
      {
        name: modelName.trim(),
        glb_url: null,
        usdz_url: usdzUrl,
      },
    ]);

    if (error) {
      Alert.alert("Error", "Failed to save model to history.");
      return;
    }

    setShowNameModal(false);
    setModelName("");
    Alert.alert("Success", "Model saved to your collection!");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Orbs */}
      <View style={styles.backgroundOrb1} />
      <View style={styles.backgroundOrb2} />
      <View style={styles.backgroundOrb3} />

      {/* Background Image with Overlay */}
      <View style={styles.bgContainer}>
        <Image 
          source={require("../../Images/ARba.png")} 
          style={styles.bgImage}
          blurRadius={2}
        />
        <LinearGradient
          colors={['rgba(10, 6, 20, 0.7)', 'rgba(10, 6, 20, 0.95)', '#0a0614']}
          style={styles.bgGradient}
          locations={[0, 0.5, 1]}
        />
      </View>

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
          <Text style={styles.headerTitle}>AR Preview</Text>
          <Text style={styles.headerSubtitle}>Ready to experience</Text>
        </View>
        
        <View style={{ width: 44 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* AR Preview Section */}
        <View style={styles.previewSection}>
          <View style={styles.previewCard}>
            <View style={styles.glowEffect} />
            <Image 
              source={require("../../Images/ARrr.png")} 
              style={styles.modelImage}
            />
            
            {/* Floating Info Badge */}
            <View style={styles.infoBadge}>
              <MaterialCommunityIcons name="sparkles" size={16} color="#10b981" />
              <Text style={styles.infoBadgeText}>AR Ready</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <MaterialCommunityIcons name="information" size={20} color="#9b5cff" />
            <Text style={styles.descriptionText}>
              Place and interact with your 3D model in the real world using augmented reality
            </Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons name="rotate-3d-variant" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>360° Rotation</Text>
            <Text style={styles.featureText}>Full control</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons name="resize" size={20} color="#10b981" />
            </View>
            <Text style={styles.featureTitle}>Scale & Move</Text>
            <Text style={styles.featureText}>Resize freely</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIconCircle}>
              <MaterialCommunityIcons name="camera" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.featureTitle}>Capture</Text>
            <Text style={styles.featureText}>Take photos</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowNameModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(155, 92, 255, 0.2)', 'rgba(106, 37, 244, 0.2)']}
                style={styles.secondaryButtonGradient}
              >
                <MaterialCommunityIcons name="content-save" size={22} color="#9b5cff" />
                <Text style={styles.secondaryButtonText}>Save Model</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openAR}
            activeOpacity={0.8}
            disabled={isOpeningAR}
          >
            <LinearGradient
              colors={['#9b5cff', '#6a25f4']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.primaryButtonContent}>
                <MaterialCommunityIcons name="cube-scan" size={26} color="white" />
                <View>
                  <Text style={styles.primaryButtonText}>Launch AR Experience</Text>
                  <Text style={styles.primaryButtonSubtext}>Tap to start</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#f59e0b" />
            <Text style={styles.tipsText}>
              Move your device slowly to find a flat surface
            </Text>
          </View>
        </View>
      </View>

      {/* AR Loading Overlay */}
      {isOpeningAR && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color="#9b5cff" />
              <View style={styles.pulseCircle} />
            </View>
            <Text style={styles.loadingTitle}>Preparing AR Experience</Text>
            <Text style={styles.loadingSubtext}>Downloading and verifying model...</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{downloadProgress}%</Text>
            </View>

            {/* Progress Steps */}
            <View style={styles.progressSteps}>
              <View style={styles.progressStep}>
                <View style={[
                  styles.progressDot, 
                  downloadProgress > 0 && styles.progressDotActive
                ]} />
                <Text style={styles.progressStepText}>Initializing</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[
                  styles.progressDot, 
                  downloadProgress > 50 && styles.progressDotActive
                ]} />
                <Text style={styles.progressStepText}>Verifying</Text>
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressStep}>
                <View style={[
                  styles.progressDot, 
                  downloadProgress === 100 && styles.progressDotActive
                ]} />
                <Text style={styles.progressStepText}>Ready</Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
              <Text style={styles.modalTitle}>Save AR Model</Text>
              <Text style={styles.modalSubtitle}>Add this model to your collection</Text>
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
                onPress={() => {
                  setShowNameModal(false);
                  setModelName("");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveToHistory}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#9b5cff', '#6a25f4']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
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
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0614' 
  },
  backgroundOrb1: {
    position: "absolute",
    top: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#6a25f4",
    opacity: 0.15,
  },
  backgroundOrb2: {
    position: "absolute",
    bottom: -100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#9b5cff",
    opacity: 0.1,
  },
  backgroundOrb3: {
    position: "absolute",
    top: "40%",
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#3b82f6",
    opacity: 0.08,
  },
  bgContainer: { 
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: { 
    width: "100%", 
    height: "100%",
    opacity: 0.3,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  content: { 
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  previewSection: { 
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  previewCard: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  glowEffect: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#9b5cff',
    opacity: 0.15,
    shadowColor: '#9b5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  modelImage: { 
    height: 280, 
    width: 280, 
    resizeMode: "contain",
    zIndex: 1,
  },
  infoBadge: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 6,
  },
  infoBadgeText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 92, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.2)',
    gap: 12,
    maxWidth: '100%',
  },
  descriptionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(155, 92, 255, 0.3)',
  },
  secondaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9b5cff',
    letterSpacing: 0.2,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  primaryButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 8,
  },
  tipsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 6, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 40,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.3)',
    alignItems: 'center',
    maxWidth: '85%',
  },
  loadingIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(155, 92, 255, 0.3)',
    top: -15,
    left: -15,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 28,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9b5cff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#9b5cff',
    shadowColor: '#9b5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  progressStepText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(20, 15, 30, 0.98)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.3)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(155, 92, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(155, 92, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});