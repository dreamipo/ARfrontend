import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../supabase/supabase";
import { useNavigation } from "@react-navigation/native";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';

const SignupScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(Math.min(strength, 3));
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "#ff4444";
    if (passwordStrength === 1) return "#ff8844";
    if (passwordStrength === 2) return "#ffbb44";
    return "#44ff88";
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return "Weak";
    if (passwordStrength === 1) return "Fair";
    if (passwordStrength === 2) return "Good";
    return "Strong";
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        if (error.status === 400 && error.message.includes("already registered")) {
          Alert.alert("Account Exists", "This email is already registered. Please login instead.");
        } else {
          Alert.alert("Signup Error", error.message);
        }
        return;
      }

      // Step 2: Insert user profile into database
      if (data.user) {
        const userId = data.user.id;

        const { error: insertError } = await supabase.from("users").insert([
          {
            id: userId,
            name: name,
            email: email,
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error("Error inserting user profile:", insertError);
          setIsLoading(false);
          Alert.alert("Error", "Failed to save profile. Please try again.");
          return;
        }

        console.log("User profile created successfully");
      }

      setIsLoading(false);
      Alert.alert(
        "Success!",
        "Account created! Check your email to confirm your account.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch (err) {
      console.error("Signup error:", err);
      setIsLoading(false);
      Alert.alert("Signup Error", "Something went wrong. Please try again.");
    }
  };

  if (!fontsLoaded && Platform.OS !== 'ios') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.innerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <LinearGradient
                colors={["#9b5cff", "#6a25f4"]}
                style={styles.logoContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="cube-outline" size={36} color="white" />
              </LinearGradient>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us and start creating amazing 3D experiences
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color="rgba(155, 92, 255, 0.6)"
                  />
                </View>
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => setName(text.trimStart())}
                  autoCapitalize="words"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color="rgba(155, 92, 255, 0.6)"
                  />
                </View>
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color="rgba(155, 92, 255, 0.6)"
                  />
                </View>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((bar) => (
                      <View
                        key={bar}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              bar <= passwordStrength ? getStrengthColor() : "rgba(255,255,255,0.1)",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                    {getStrengthText()}
                  </Text>
                </View>
              )}

              {/* Terms & Privacy */}
              <View style={styles.termsContainer}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={16}
                  color="rgba(155, 92, 255, 0.6)"
                />
                <Text style={styles.termsText}>
                  By signing up, you agree to our{" "}
                  <Text style={styles.termsLink}>Terms</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Signup Button */}
              <TouchableOpacity onPress={handleSignup} activeOpacity={0.8} disabled={isLoading}>
                <LinearGradient
                  colors={["#9b5cff", "#6a25f4"]}
                  style={styles.signupBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.signupBtnText}>Create Account</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0614" },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  innerContainer: { 
    flex: 1, 
    paddingHorizontal: 24, 
    paddingVertical: 40, 
    justifyContent: "space-between" 
  },
  logoSection: { alignItems: "center", marginBottom: 32},
  logoContainer: {
    height: 70,
    width: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9b5cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { 
    fontSize: 34, 
    color: "white", 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Inter_800ExtraBold',
    fontWeight: '800',
    textAlign: "center", 
    marginTop: 20, 
    letterSpacing: -1,
  },
  subtitle: { 
    fontSize: 15, 
    color: "rgba(255,255,255,0.6)", 
    textAlign: "center", 
    marginTop: 10,
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_400Regular',
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  formSection: { flex: 1 },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(28, 21, 48, 0.6)", 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: "rgba(106, 37, 244, 0.3)", 
    marginBottom: 16, 
    paddingHorizontal: 16, 
    height: 56 
  },
  inputIconContainer: { marginRight: 12 },
  input: { 
    flex: 1, 
    color: "white", 
    fontSize: 15, 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_500Medium',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  eyeIcon: { padding: 4 },
  strengthContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 20, 
    paddingHorizontal: 4 
  },
  strengthBars: { flexDirection: "row", gap: 6, flex: 1, marginRight: 12 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { 
    fontSize: 13, 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_600SemiBold',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  termsContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 24, 
    paddingHorizontal: 4, 
    gap: 8 
  },
  termsText: { 
    flex: 1, 
    fontSize: 12, 
    color: "rgba(255,255,255,0.5)", 
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_400Regular',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  termsLink: { 
    color: "#9b5cff", 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_600SemiBold',
    fontWeight: '600',
  },
  signupBtn: { 
    height: 56, 
    borderRadius: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    shadowColor: "#9b5cff", 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 16, 
    elevation: 10 
  },
  signupBtnText: { 
    color: "white", 
    fontSize: 16, 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loginContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: 20 
  },
  loginText: { 
    color: "rgba(255,255,255,0.55)", 
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_400Regular',
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  loginLink: { 
    color: "#9b5cff", 
    fontSize: 15, 
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default SignupScreen;