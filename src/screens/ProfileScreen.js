import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase/supabase";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadUser();
    loadProfileImage();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
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
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                           LOAD USER (AUTH + DB)                             */
  /* -------------------------------------------------------------------------- */

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    setUser(authUser);

    const { data: userRow, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.log("DB fetch error:", error);
      return;
    }

    setDbUser(userRow);
    setName(userRow.name || "");
  };

  /* -------------------------------------------------------------------------- */
  /*                      LOAD PROFILE IMAGE FROM ASYNCSTORAGE                  */
  /* -------------------------------------------------------------------------- */

 const loadProfileImage = async () => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const img = await AsyncStorage.getItem(`profileImage_${authUser.id}`);
    if (img) setProfileImage(img);
  } catch (error) {
    console.log("Error loading profile image:", error);
  }
};


  /* -------------------------------------------------------------------------- */
  /*                           PICK IMAGE & SAVE LOCALLY                         */
  /* -------------------------------------------------------------------------- */

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    const image = result.assets[0];
    saveImageLocally(image.uri);
  };

const saveImageLocally = async (imageUri) => {
  try {
    setUploading(true);

    await AsyncStorage.setItem(`profileImage_${user.id}`, imageUri);
    setProfileImage(imageUri);

    Alert.alert("Success", "Profile picture updated! ✨");
  } catch (error) {
    console.error("Error saving:", error);
    Alert.alert("Error", "Failed to save image");
  } finally {
    setUploading(false);
  }
};


  /* -------------------------------------------------------------------------- */
  /*                              UPDATE USER NAME                               */
  /* -------------------------------------------------------------------------- */

  const saveName = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { name },
    });
    if (authError) {
      Alert.alert("Auth Error", authError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("users")
      .update({ name })
      .eq("id", user.id);

    if (dbError) {
      Alert.alert("Database Error", dbError.message);
      return;
    }

    Alert.alert("Success", "Profile updated!");
    setIsEditing(false);
    loadUser();
  };

  /* -------------------------------------------------------------------------- */
  /*                                 LOGOUT USER                                */
  /* -------------------------------------------------------------------------- */

  const logout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace("LoginScreen");
          },
        },
      ]
    );
  };

  if (!user || !dbUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9b5cff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Use local profile image if available, otherwise use Dicebear
  const avatar = profileImage || `https://api.dicebear.com/9.x/thumbs/png?seed=${dbUser.name}`;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={{width:'33%'}}>
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={35}
                  color="white"
                />
              </TouchableOpacity>
              <View style={{width:'33%'}}>
                 <Text style={styles.title}>Profile</Text>
    
               
              </View>
              <View style={{width:'33%'}}>
                
              </View>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={["rgba(155, 92, 255, 0.15)", "rgba(106, 37, 244, 0.15)"]}
              style={styles.profileGradient}
            >
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <View style={styles.avatarOverlay}>
                      {uploading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <MaterialCommunityIcons
                          name="camera"
                          size={24}
                          color="white"
                        />
                      )}
                    </View>
                    <View style={styles.editBadge}>
                      <MaterialCommunityIcons
                        name="pencil"
                        size={16}
                        color="white"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={styles.userName}>{dbUser.name || "User"}</Text>
                <Text style={styles.userEmail}>{dbUser.email}</Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <MaterialCommunityIcons
                      name="cube-outline"
                      size={24}
                      color="#9b5cff"
                    />
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>Models</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Account Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editButton}
              >
                <MaterialCommunityIcons
                  name={isEditing ? "close" : "pencil"}
                  size={18}
                  color="#9b5cff"
                />
                <Text style={styles.editButtonText}>
                  {isEditing ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={22}
                    color="rgba(155, 92, 255, 0.7)"
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      placeholder="Enter your name"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{name || "Not set"}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Email Display */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color="rgba(155, 92, 255, 0.7)"
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{dbUser.email}</Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            {isEditing && (
              <TouchableOpacity onPress={saveName} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#9b5cff", "#6a25f4"]}
                  style={styles.saveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Settings Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitlee}>Settings</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={22}
                    color="#9b5cff"
                  />
                </View>
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={22}
                    color="#9b5cff"
                  />
                </View>
                <Text style={styles.settingText}>Privacy & Security</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={22}
                    color="#9b5cff"
                  />
                </View>
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={22}
                    color="#9b5cff"
                  />
                </View>
                <Text style={styles.settingText}>About</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="logout"
              size={22}
              color="#ff4d4d"
            />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </Animated.View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe : {
    flex: 1,
     backgroundColor: "#0a0614",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0614",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0614",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    
  },
  header: {
    marginBottom: 10,

  
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.2,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Inter' }),

    textAlign: "center",
  },
  profileCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
  },
  profileGradient: {
    borderWidth: 1,
    borderColor: "rgba(155, 92, 255, 0.3)",
    borderRadius: 24,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(155, 92, 255, 0.4)",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#9b5cff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0a0614",
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  userName: {
    fontSize: 24,
    color: "white",
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Inter' }),
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 20,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 32,
    marginTop: 8,
  },
  statBox: {
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    color: "white",
    fontWeight: "700",
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Inter' }),
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Inter' }),
  },
  sectionTitlee: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    paddingBottom: 10,
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Inter' }),
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(155, 92, 255, 0.3)",
  },
  editButtonText: {
    color: "#9b5cff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  infoCard: {
    backgroundColor: "rgba(28, 21, 48, 0.6)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(106, 37, 244, 0.3)",
    marginBottom: 12,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  infoValue: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  infoInput: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
    padding: 0,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(28, 21, 48, 0.6)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(106, 37, 244, 0.3)",
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(155, 92, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#ff4d4d",
    gap: 8,
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    marginBottom: 16,
  },
  logoutBtnText: {
    color: "#ff4d4d",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
  versionText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Inter' }),
  },
});