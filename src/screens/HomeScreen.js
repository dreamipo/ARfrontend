import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 80) / 4;

export default function HomeScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedModelUrl, setGeneratedModelUrl] = useState({ 
    modelUrl: null, 
    usdzUrl: null, 
    thumbnailUrl: null
  });
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  const progressIntervalRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const runImageAnimation = () => {
    const imageAnim = new Animated.Value(0);
    Animated.spring(imageAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const pickImages = async () => {
    Alert.alert(
      "Select Source",
      "How do you want to upload images?",
      [
        {
          text: "Upload from Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              selectionLimit: 4 - images.length,
              quality: 1,
            });

            if (!result.canceled) {
              const picked = result.assets;
              const newImages = [...images, ...picked];

              if (newImages.length > 4) {
                Alert.alert("Limit Reached", "Maximum 4 images allowed.");
                return;
              }

              setImages(newImages);
              runImageAnimation();
            }
          }
        },
        {
          text: "Open Camera",
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              Alert.alert("Permission Required", "Camera permission not granted.");
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            });

            if (!result.canceled) {
              const clickedImages = [result.assets[0]];
              const newImages = [...images, ...clickedImages];

              if (newImages.length > 4) {
                Alert.alert("Limit Reached", "Maximum 4 images allowed.");
                return;
              }

              setImages(newImages);
              runImageAnimation();
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  const resetAll = () => {
    setImages([]);
    setLoading(false);
    setGeneratedModelUrl({ modelUrl: null, usdzUrl: null, thumbnailUrl: null });
    setProgress(0);
    setProgressMessage('');
  };

  const handleGenerate = async () => {
    if (images.length !== 1 && images.length !== 4) {
      Alert.alert("Invalid Image Count", "Upload exactly 1 or 4 images.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressMessage('Initializing...');

    const formData = new FormData();
    images.forEach((img, index) => {
      formData.append("files", {
        uri: img.uri,
        type: img.type || "image/jpeg",
        name: img.fileName || `image_${index}.jpg`,
      });
    });

    try {
      const backendUrl = "https://ar-backend-9wul.onrender.com/generate-3d-model";

      // Professional progress simulation - 120 seconds to reach 90%
      let currentProgress = 0;
      const totalDuration = 120000; // 2 minutes
      const updateInterval = 3000; // 3 seconds
      const targetProgress = 90;
      const totalSteps = totalDuration / updateInterval; // 40 steps
      const progressPerStep = targetProgress / totalSteps; // 2.25% per step

      const progressMessages = [
        { threshold: 0, message: 'Preparing images...' },
        { threshold: 15, message: 'Analyzing image features...' },
        { threshold: 30, message: 'Building 3D mesh...' },
        { threshold: 45, message: 'Applying textures...' },
        { threshold: 60, message: 'Optimizing geometry...' },
        { threshold: 75, message: 'Converting to AR format...' },
        { threshold: 85, message: 'Finalizing model...' },
      ];

      progressIntervalRef.current = setInterval(() => {
        currentProgress += progressPerStep;
        
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(progressIntervalRef.current);
        }

        // Update message based on progress
        const currentMessage = progressMessages
          .reverse()
          .find(item => currentProgress >= item.threshold);
        
        if (currentMessage) {
          setProgressMessage(currentMessage.message);
        }

        setProgress(currentProgress);
        
        // Animate progress bar smoothly
        Animated.timing(progressAnim, {
          toValue: currentProgress,
          duration: updateInterval,
          useNativeDriver: false,
        }).start();
      }, updateInterval);

      const res = await axios.post(backendUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressIntervalRef.current);

      console.log("BACKEND RESPONSE:", res.data);

      if (res.data.status === "success") {
        // Extract URLs - handle both array and string formats
        const glbUrls = res.data?.file_urls?.glb;
        const usdzUrls = res.data?.file_urls?.usdz;
        const thumbnailUrl = res.data?.file_urls?.thumbnail;
        
        const modelUrl = Array.isArray(glbUrls) ? glbUrls[0] : glbUrls || res.data?.glbUrl || null;
        const usdzUrl = Array.isArray(usdzUrls) ? usdzUrls[0] : usdzUrls || res.data?.usdzUrl || null;

        console.log("GLB URL:", modelUrl);
        console.log("USDZ URL:", usdzUrl);
        console.log("THUMBNAIL URL:", thumbnailUrl);

        if (!modelUrl && !usdzUrl) {
          Alert.alert("Error", "Model generated but file URLs missing!");
          setLoading(false);
          setProgress(0);
          return;
        }

        // Smooth completion animation
        setProgressMessage('Processing complete! ✨');
        setProgress(100);
        
        Animated.timing(progressAnim, {
          toValue: 100,
          duration: 500,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          setGeneratedModelUrl({ 
            modelUrl, 
            usdzUrl, 
            thumbnailUrl
          });
          Alert.alert("Success", "3D model generated successfully!");
        }, 600);
      } else {
        Alert.alert("Error", res.data.message || "Generation failed");
        setProgress(0);
      }
    } catch (err) {
      // Clear interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      console.error(err);
      Alert.alert("Error", "Something went wrong while generating the 3D model.");
      setProgress(0);
    }

    setLoading(false);
  };

  const canGenerate = images.length === 1 || images.length === 4;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Create Magic ✨</Text>
              <Text style={styles.title}>Transform Photos to 3D</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn} 
              onPress={() => navigation.navigate("ProfileScreen")}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={28} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Upload Card */}
          <View style={styles.uploadCard}>
            <LinearGradient
              colors={['rgba(155, 92, 255, 0.15)', 'rgba(106, 37, 244, 0.15)']}
              style={styles.uploadGradient}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="image-multiple" size={32} color="#9b5cff" />
              </View>
              
              <Text style={styles.uploadTitle}>Upload Your Photos</Text>
              <Text style={styles.uploadSubtitle}>
                Choose 1 image for quick scan or 4 images{"\n"}for detailed 360° model
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="image-outline" size={20} color="#9b5cff" />
                  <Text style={styles.statText}>{images.length}/4</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color="#9b5cff" />
                  <Text style={styles.statText}>~2 min</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.uploadBtn}
                onPress={pickImages}
                disabled={images.length >= 4}
              >
                <LinearGradient
                  colors={images.length >= 4 ? ['#4a4a4a', '#3a3a3a'] : ['#9b5cff', '#6a25f4']}
                  style={styles.uploadBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons 
                    name={images.length >= 4 ? "check" : "plus"} 
                    size={22} 
                    color="white" 
                  />
                  <Text style={styles.uploadBtnText}>
                    {images.length >= 4 ? "Maximum Reached" : "Select Images"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Image Grid */}
          {images.length > 0 && (
            <View style={styles.imageSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Selected Images</Text>
                <TouchableOpacity onPress={resetAll}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.imageGrid}>
                {images.map((img, index) => (
                  <Animated.View 
                    key={index} 
                    style={styles.imageWrapper}
                  >
                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)']}
                      style={styles.imageOverlay}
                    />
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="white" />
                    </TouchableOpacity>
                    <View style={styles.imageNumber}>
                      <Text style={styles.imageNumberText}>{index + 1}</Text>
                    </View>
                  </Animated.View>
                ))}
                
                {/* Empty slots */}
                {[...Array(4 - images.length)].map((_, i) => (
                  <View key={`empty-${i}`} style={styles.emptySlot}>
                    <MaterialCommunityIcons name="image-plus" size={28} color="rgba(255,255,255,0.2)" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {!(generatedModelUrl.modelUrl || generatedModelUrl.usdzUrl) ? (
              <TouchableOpacity
                disabled={!canGenerate || loading}
                onPress={handleGenerate}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={!canGenerate || loading ? ['#4a4a4a', '#3a3a3a'] : ['#9b5cff', '#6a25f4']}
                  style={styles.generateBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.progressText}>{progressMessage}</Text>
                          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <Animated.View 
                            style={[
                              styles.progressBarFill,
                              {
                                width: progressAnim.interpolate({
                                  inputRange: [0, 100],
                                  outputRange: ['0%', '100%'],
                                })
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="auto-fix" size={22} color="white" />
                      <Text style={styles.generateBtnText}>Generate 3D Model</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("ModelViewer", {
                  modelUrl: generatedModelUrl.modelUrl,
                  usdzUrl: generatedModelUrl.usdzUrl,
                  thumbnailUrl: generatedModelUrl.thumbnailUrl,
                  name: "Generated Model"
                })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.generateBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="cube-outline" size={22} color="white" />
                  <Text style={styles.generateBtnText}>View 3D Model</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {images.length > 0 && !loading && (
              <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
                <MaterialCommunityIcons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tips Card */}
          {images.length === 0 && (
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.tipText}>Use well-lit, clear photos</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.tipText}>Capture from different angles</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  <Text style={styles.tipText}>Avoid blurry or dark images</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0614' 
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: { 
    color: 'white', 
    fontSize: 27, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  uploadCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  uploadGradient: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(155, 92, 255, 0.3)',
    borderRadius: 24,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(155, 92, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(155, 92, 255, 0.3)',
  },
  uploadTitle: {
    fontSize: 22,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  uploadBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  uploadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700',
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700',
  },
  clearText: {
    color: '#9b5cff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: { 
    width: IMAGE_SIZE, 
    height: IMAGE_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: { 
    width: '100%', 
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imageNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700',
  },
  emptySlot: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionSection: {
    gap: 12,
    marginBottom: 24,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  generateBtnText: { 
    color: 'white', 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700', 
    fontSize: 17,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  progressSection: {
    width: '100%',
    gap: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressText: {
    color: 'white',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '600',
  },
  progressPercentage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resetText: { 
    color: 'rgba(255,255,255,0.7)', 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '600',
    fontSize: 16,
  },
  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 16,
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    flex: 1,
  },
});