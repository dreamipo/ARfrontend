import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

const QRScreen = ({ route, navigation }) => {
  const { usdzUrl } = route.params;
  const qrRef = useRef();

  const downloadQR = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot save QR without permission.");
        return;
      }

      const uri = await captureRef(qrRef, {
        format: "jpg",
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("QR_Codes", asset, false);

      Alert.alert("Saved!", "QR code saved to gallery.");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to save QR code.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Share via QR</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.title}>Scan to View in AR (iOS)</Text>

      <View ref={qrRef} collapsable={false} style={styles.qrBox}>
        <QRCode value={usdzUrl} size={260} />
      </View>

      

      <Text style={styles.smallText}>
        Scan this QR with another iPhone to open the 3D model in AR.
      </Text>

      <TouchableOpacity style={styles.downloadButton} onPress={downloadQR}>
        <MaterialCommunityIcons name="download" size={22} color="white" />
        <Text style={styles.downloadText}>Download QR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default QRScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    paddingTop: 0,
  },

  /** Top Navigation Bar */
  topBar: {
    height: 55,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  topTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
  },

  title: {
    fontSize: 18,
    color: "white",
    marginBottom: 30,
    fontWeight: "500",
  },

  qrBox: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
  },

  smallText: {
    color: "white",
    marginTop: 20,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: 20,
  },

  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27AE60",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 95,
    gap: 8,
  },

  downloadText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
