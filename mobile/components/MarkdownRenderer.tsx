import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { themes } from "../constants/themes";
import { getTheme } from "../lib/storage";
import type { Theme } from "../constants/types";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = themes[getTheme()];

  const rendered = renderMarkdown(content, theme);

  return <View>{rendered}</View>;
}

function renderMarkdown(text: string, theme: Theme): React.ReactNode[] {
  const blocks = splitBlocks(text);
  return blocks.map((block, i) => {
    if (block.type === "heading") {
      const sizes: Record<number, number> = { 1: 22, 2: 19, 3: 16 };
      return (
        <Text key={i} style={{ fontSize: sizes[block.level || 1] || 15, fontWeight: "700", color: theme.colors.text, marginTop: i > 0 ? 14 : 0, marginBottom: 6 }}>
          {renderInline(block.content || "", theme)}
        </Text>
      );
    }
    if (block.type === "code") {
      return (
        <View key={i} style={[codeStyles.container, { backgroundColor: theme.colors.bgTertiary, borderColor: theme.colors.border }]}>
          {block.language ? (
            <View style={[codeStyles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[codeStyles.language, { color: theme.colors.textMuted }]}>{block.language}</Text>
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[codeStyles.code, { color: theme.colors.text }]} selectable>{block.content || ""}</Text>
          </ScrollView>
        </View>
      );
    }
    if (block.type === "blockquote") {
      return (
        <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: theme.colors.primary, paddingLeft: 12, marginVertical: 8 }}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: theme.colors.text, opacity: 0.8 }}>
            {renderInline(block.content || "", theme)}
          </Text>
        </View>
      );
    }
    if (block.type === "hr") {
      return <View key={i} style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }} />;
    }
    if (block.type === "ul" || block.type === "ol") {
      return (
        <View key={i} style={{ marginVertical: 8 }}>
          {(block.items || []).map((item: string, j: number) => (
            <Text key={j} style={{ fontSize: 15, lineHeight: 22, color: theme.colors.text, marginBottom: 4 }}>
              {block.type === "ol" ? `${j + 1}. ` : "\u2022 "}{renderInline(item, theme)}
            </Text>
          ))}
        </View>
      );
    }
    if (block.type === "paragraph") {
      return (
        <Text key={i} style={{ fontSize: 15, lineHeight: 22, color: theme.colors.text, marginBottom: 8 }}>
          {renderInline(block.content || "", theme)}
        </Text>
      );
    }
    return null;
  });
}

function splitBlocks(text: string): Array<{ type: string; content?: string; level?: number; language?: string; items?: string[] }> {
  const lines = text.split("\n");
  const blocks: Array<{ type: string; content?: string; level?: number; language?: string; items?: string[] }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n"), language: lang || undefined });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push({ type: "blockquote", content: line.slice(2) });
      i++;
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].trimStart().startsWith("```") && !lines[i].match(/^#{1,6}\s/) && !lines[i].startsWith("> ") && !/^[\s]*[-*+]\s+/.test(lines[i]) && !/^[\s]*\d+\.\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", content: paraLines.join("\n") });
    }
  }

  return blocks;
}

function renderInline(text: string, theme: Theme): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<Text key={key++}>{codeMatch[1]}</Text>);
      parts.push(
        <Text key={key++} style={{ fontFamily: "monospace", fontSize: 13, color: theme.colors.accent, backgroundColor: theme.colors.bgTertiary, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
          {codeMatch[2]}
        </Text>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<Text key={key++}>{boldMatch[1]}</Text>);
      parts.push(<Text key={key++} style={{ fontWeight: "700" }}>{boldMatch[2]}</Text>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<Text key={key++}>{italicMatch[1]}</Text>);
      parts.push(<Text key={key++} style={{ fontStyle: "italic" }}>{italicMatch[2]}</Text>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) parts.push(<Text key={key++}>{linkMatch[1]}</Text>);
      parts.push(<Text key={key++} style={{ color: theme.colors.primary }}>{linkMatch[2]}</Text>);
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    parts.push(<Text key={key++}>{remaining}</Text>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

const codeStyles = StyleSheet.create({
  container: { borderRadius: 8, borderWidth: 1, marginVertical: 8, overflow: "hidden" },
  header: { paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1 },
  language: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  code: { fontFamily: "monospace", fontSize: 13, lineHeight: 20, padding: 12 },
});
