import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader, Wrench } from "lucide-react-native";
import { useMessages, useSession } from "../../hooks/useApi";
import { useSSE } from "../../hooks/useSSE";
import { Message, MessagePart } from "../../lib/api";
import { getTheme } from "../../lib/storage";
import { themes } from "../../constants/themes";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = themes[getTheme()];
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: session } = useSession(id || "");
  const { data: serverMessages } = useMessages(id || "");
  const { send, streaming, parts: streamParts, error } = useSSE();

  const allMessages: Message[] = [...(serverMessages || [])];

  const handleSend = () => {
    if (!input.trim() || !id) return;
    send(id, input.trim());
    setInput("");
  };

  useEffect(() => {
    if (streamParts.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [streamParts.length]);

  const renderPart = (part: MessagePart, index: number) => {
    if (part.type === "text" && part.text) {
      return (
        <Text key={index} style={[styles.messageText, { color: theme.colors.text }]}>
          {part.text}
        </Text>
      );
    }
    if (part.type === "tool-invocation" && part.toolInvocation) {
      const { toolName, state } = part.toolInvocation;
      return (
        <View
          key={index}
          style={[styles.toolCard, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}
        >
          <View style={styles.toolHeader}>
            <Wrench size={14} color={theme.colors.secondary} />
            <Text style={[styles.toolName, { color: theme.colors.secondary }]}>{toolName}</Text>
            {state === "call" && <Loader size={12} color={theme.colors.textMuted} />}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.bgSecondary, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {session?.title || "Chat"}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user"
                ? { backgroundColor: theme.colors.primary, alignSelf: "flex-end", maxWidth: "80%" }
                : { backgroundColor: theme.colors.surface, alignSelf: "flex-start" },
            ]}
          >
            {item.parts.map((part, i) => renderPart(part, i))}
          </View>
        )}
        ListFooterComponent={
          streamParts.length > 0 ? (
            <View style={[styles.bubble, { backgroundColor: theme.colors.surface, alignSelf: "flex-start" }]}>
              {streamParts.map((part, i) => renderPart(part, i))}
            </View>
          ) : streaming ? (
            <View style={[styles.bubble, { backgroundColor: theme.colors.surface, alignSelf: "flex-start" }]}>
              <View style={styles.typing}>
                <Loader size={14} color={theme.colors.textMuted} />
                <Text style={[styles.typingText, { color: theme.colors.textMuted }]}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {error && (
        <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
      )}

      <View style={[styles.inputBar, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.bgSecondary, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.textInput, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.colors.primary : theme.colors.surface }]}
          onPress={handleSend}
          disabled={!input.trim() || streaming}
        >
          <Send size={18} color={input.trim() ? theme.colors.primaryText : theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600", flex: 1 },
  bubble: {
    padding: 14,
    borderRadius: 14,
    maxWidth: "85%",
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  toolCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  toolName: { fontSize: 13, fontWeight: "600" },
  typing: { flexDirection: "row", alignItems: "center", gap: 6 },
  typingText: { fontSize: 14 },
  error: { fontSize: 13, textAlign: "center", paddingVertical: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
