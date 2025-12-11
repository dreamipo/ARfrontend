import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Image,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { supabase } from "../supabase/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ----------- History Card Component -----------
const HistoryCard = ({
  item,
  index,
  multiSelectMode,
  selectedItems,
  menuOpenId,
  setMenuOpenId,
  toggleSelectItem,
  openItem,
  openAR,
  navigation,
  confirmDelete,
}) => {
  const isSelected = selectedItems.some((i) => i.id === item.id);
  const animatedValue = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        opacity: animatedValue,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (multiSelectMode) {
            toggleSelectItem(item);
          } else {
            openItem(item);
          }
        }}
        activeOpacity={0.7}
        style={[styles.card, isSelected && styles.selectedCard]}
      >
        <LinearGradient
          colors={
            isSelected
              ? ["rgba(76, 110, 245, 0.2)", "rgba(76, 110, 245, 0.1)"]
              : ["rgba(155, 92, 255, 0.1)", "rgba(106, 37, 244, 0.05)"]
          }
          style={styles.cardGradient}
        >
          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Thumbnail */}
            {item.thumbnail_url ? (
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: item.thumbnail_url }}
                  style={styles.thumbnail}
                  resizeMode="contain"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)"]}
                  style={styles.thumbnailOverlay}
                />
              </View>
            ) : (
              <View style={styles.placeholderThumbnail}>
                <MaterialCommunityIcons
                  name="cube-outline"
                  size={28}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
            )}

            {/* Info Section */}
            <View style={styles.infoSection}>
              <Text style={styles.modelName} numberOfLines={1}>
                {item.name}
              </Text>

              {/* Badges */}
              <View style={styles.badgeRow}>
                {item.glb_url && (
                  <View style={styles.badge3D}>
                    <MaterialCommunityIcons
                      name="cube-outline"
                      size={14}
                      color="#6366f1"
                    />
                    <Text style={styles.badgeText3D}>3D Model</Text>
                  </View>
                )}
                {item.usdz_url && (
                  <View style={styles.badgeAR}>
                    <MaterialCommunityIcons
                      name="rotate-3d-variant"
                      size={14}
                      color="#10b981"
                    />
                    <Text style={styles.badgeTextAR}>AR Ready</Text>
                  </View>
                )}
              </View>

              {/* Date */}
              <View style={styles.dateContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </View>
            </View>

            {/* Right Side: Checkbox or Menu */}
            <View style={styles.rightSection}>
              {multiSelectMode ? (
                <TouchableOpacity
                  onPress={() => toggleSelectItem(item)}
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <MaterialCommunityIcons name="check-bold" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() =>
                    setMenuOpenId(menuOpenId === item.id ? null : item.id)
                  }
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={24}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Dropdown Menu - Outside LinearGradient */}
        {menuOpenId === item.id && !multiSelectMode && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpenId(null);
                navigation.navigate("QRScreen", { usdzUrl: item.usdz_url });
              }}
            >
              <MaterialCommunityIcons name="qrcode" size={18} color="#9b5cff" />
              <Text style={styles.menuText}>Share QR</Text>
            </TouchableOpacity>

            {item.usdz_url && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpenId(null);
                  openAR(item.usdz_url);
                }}
              >
                <MaterialCommunityIcons
                  name="rotate-3d-variant"
                  size={18}
                  color="#10b981"
                />
                <Text style={styles.menuText}>View in AR</Text>
              </TouchableOpacity>
            )}

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpenId(null);
                confirmDelete(item.id);
              }}
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color="#ef4444"
              />
              <Text style={[styles.menuText, { color: "#ef4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ----------- History Screen Component -----------
export default function HistoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserModels = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("User not logged in");
        setLoading(false);
        return;
      }

      // Fetch user's models from database (RLS automatically filters by user_id)
      const { data: models, error: modelsError } = await supabase
        .from('user_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (modelsError) {
        console.error("Error fetching models:", modelsError);
        setLoading(false);
        return;
      }

      // Generate public URLs for each model
      const bucketName = 'user-models';
      const itemsList = models.map((model) => {
        const glbUrl = model.glb_path
  ? supabase.storage.from(bucketName).getPublicUrl(model.glb_path).data.publicUrl
  : null;


        const usdzUrl = model.usdz_path
          ? supabase.storage.from(bucketName).getPublicUrl(model.usdz_path).data.publicUrl
          : null;

        const thumbnailUrl = model.thumbnail_path
          ? supabase.storage.from(bucketName).getPublicUrl(model.thumbnail_path).data.publicUrl
          : null;

        return {
          id: model.id,
          name: model.name,
          glb_url: glbUrl,
          usdz_url: usdzUrl,
          thumbnail_url: thumbnailUrl,
          created_at: model.created_at,
        };
      });

      setItems(itemsList);
    } catch (err) {
      console.error("Error loading models:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserModels();
    }, [])
  );

  const openAR = async (url) => {
    if (!url) return;
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL(url);
      } else {
        const intentUrl =
          `intent://arvr.google.com/scene-viewer/1.0` +
          `?file=${encodeURIComponent(url)}` +
          `&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end`;
        await Linking.openURL(intentUrl);
      }
    } catch (err) {
      Alert.alert("Error", "Could not open AR viewer.");
    }
  };

  const openItem = (item) => {
    // Close menu when opening item
    setMenuOpenId(null);
    
    if (item.usdz_url && !item.glb_url) {
      openAR(item.usdz_url);
    } else {
      navigation.navigate("MiniModelViewer", {
        modelUrl: item.glb_url,
        usdzUrl: item.usdz_url,
      });
    }
  };

  const toggleSelectItem = (item) => {
    if (selectedItems.find((i) => i.id === item.id)) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      "Delete Items",
      `Are you sure you want to delete ${selectedItems.length} item${
        selectedItems.length > 1 ? "s" : ""
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete from database
              const idsToDelete = selectedItems.map(item => item.id);
              const { error: deleteError } = await supabase
                .from('user_models')
                .delete()
                .in('id', idsToDelete);

              if (deleteError) {
                console.error("Error deleting models:", deleteError);
                Alert.alert("Error", "Failed to delete some items.");
                return;
              }

              // Update local state
              setItems((prev) => prev.filter((i) => !selectedItems.some(s => s.id === i.id)));
              setSelectedItems([]);
              setMultiSelectMode(false);
              
              Alert.alert("Success", "Items deleted successfully.");
            } catch (error) {
              console.error("Error during deletion:", error);
              Alert.alert("Error", "An error occurred while deleting items.");
            }
          },
        },
      ]
    );
  };

  const deleteItem = async (item) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('user_models')
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        console.error("Error deleting model:", deleteError);
        Alert.alert("Error", "Failed to delete item.");
        return;
      }

      // Update local state
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
      setMenuOpenId(null);
      
      Alert.alert("Success", "Item deleted successfully.");
    } catch (error) {
      console.error("Error during deletion:", error);
      Alert.alert("Error", "An error occurred while deleting the item.");
    }
  };

  const confirmDelete = (itemId) => {
    const item = items.find(i => i.id === itemId);
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteItem(item), style: "destructive" },
      ],
      { cancelable: true }
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="history" size={48} color="#9b5cff" />
      </View>
      <Text style={styles.emptyTitle}>No Models Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your generated 3D models will appear here.{"\n"}Start creating to build your collection!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate("HomeTab")}
      >
        <LinearGradient
          colors={["#9b5cff", "#6a25f4"]}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.emptyButtonText}>Create First Model</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback onPress={() => setMenuOpenId(null)}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View>
            <Text style={styles.title}>History</Text>
          </View>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedItems([]);
              setMenuOpenId(null);
            }}
          >
            <LinearGradient
              colors={
                multiSelectMode
                  ? ["#ef4444", "#dc2626"]
                  : ["rgba(155, 92, 255, 0.3)", "rgba(106, 37, 244, 0.3)"]
              }
              style={styles.selectButtonGradient}
            >
              <MaterialCommunityIcons
                name={multiSelectMode ? "close" : "checkbox-multiple-marked-outline"}
                size={18}
                color="white"
              />
              <Text style={styles.selectText}>
                {multiSelectMode ? "Cancel" : "Select"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Bar */}
        {items.length > 0 && !loading && (
          <Animated.View style={[styles.statsBar, { opacity: fadeAnim }]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cube-outline" size={20} color="#9b5cff" />
              <Text style={styles.statText}>{items.length} Models</Text>
            </View>
            {multiSelectMode && selectedItems.length > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="checkbox-marked" size={20} color="#4C6EF5" />
                  <Text style={styles.statText}>{selectedItems.length} Selected</Text>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9b5cff" />
            <Text style={styles.loadingText}>Loading your models...</Text>
          </View>
        ) : items.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <HistoryCard
                item={item}
                index={index}
                multiSelectMode={multiSelectMode}
                selectedItems={selectedItems}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                toggleSelectItem={toggleSelectItem}
                openItem={openItem}
                openAR={openAR}
                navigation={navigation}
                confirmDelete={confirmDelete}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Delete Button */}
        {multiSelectMode && selectedItems.length > 0 && (
          <Animated.View
            style={[
              styles.deleteButtonContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity onPress={deleteSelectedItems} activeOpacity={0.8}>
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={styles.deleteButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="delete-outline" size={22} color="white" />
                <Text style={styles.deleteButtonText}>Delete Selected</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// ------------------- Styles -------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1c1022" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { 
    fontSize: 28, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700", 
    color: "#fff" 
  },
  selectButton: { borderRadius: 12 },
  selectButtonGradient: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  selectText: { 
    color: "white", 
    marginLeft: 6, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "600" 
  },

  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
  },
  statItem: { flexDirection: "row", alignItems: "center" },
  statText: { 
    color: "white", 
    marginLeft: 6, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "600" 
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 10,
  },

  listContent: { padding: 20, paddingBottom: 120 },

  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "visible",
  },
  selectedCard: { 
    borderWidth: 2, 
    borderColor: "#4C6EF5",
  },
  cardGradient: { 
    borderRadius: 16, 
    padding: 12,
    overflow: "hidden",
  },

  cardContent: { flexDirection: "row", alignItems: "center" },
  thumbnailContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: { 
    width: "100%", 
    height: "100%",
  },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "50%",
  },
  placeholderThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: { flex: 1, paddingLeft: 12, justifyContent: "center" },
  modelName: { 
    color: "#fff", 
    fontSize: 16, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700" 
  },
  badgeRow: { flexDirection: "row", marginTop: 6 },
  badge3D: {
    flexDirection: "row",
    backgroundColor: "rgba(99,102,241,0.2)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    marginRight: 6,
  },
  badgeText3D: { 
    color: "#6366f1", 
    fontSize: 10, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    marginLeft: 2 
  },
  badgeAR: {
    flexDirection: "row",
    backgroundColor: "rgba(16,185,129,0.2)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
  },
  badgeTextAR: { 
    color: "#10b981", 
    fontSize: 10, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    marginLeft: 2 
  },
  dateContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dateText: { 
    color: "rgba(255,255,255,0.5)", 
    fontSize: 12, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    marginLeft: 4 
  },

  rightSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4C6EF5",
    borderColor: "#4C6EF5",
  },
  menuButton: { padding: 4 },
  menu: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#2a1b3b",
    borderRadius: 12,
    paddingVertical: 8,
    width: 150,
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: { 
    color: "#fff", 
    fontSize: 14, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    marginLeft: 8 
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(155,92,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 24, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700", 
    color: "#fff", 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: "rgba(255,255,255,0.6)", 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    textAlign: "center" 
  },
  emptyButton: { marginTop: 20 },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  emptyButtonText: { 
    color: "#fff", 
    marginLeft: 6, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "600" 
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { 
    marginTop: 10, 
    color: "#fff",
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },

  deleteButtonContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteButtonText: { 
    color: "#fff", 
    marginLeft: 8, 
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: "700" 
  },
});