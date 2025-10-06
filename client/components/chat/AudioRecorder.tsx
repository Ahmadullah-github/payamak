import React from "react";
import { View, Text, Pressable, Animated,StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../constants/theme"; 
import { AppColors } from "../../constants/colors"; 
import { useRecorder } from "../../hooks/useRecorder"; 
interface AudioRecorderProps {
  onRecordingComplete: (uri: string) => void; // Called when recording stops
  onCancel: () => void; // Called when recording is canceled
  accessibilityLabel?: string; // Optional accessibility label
  testID?: string; // Optional test identifier
}
export default function AudioRecorder({
  onRecordingComplete,
  onCancel,
  accessibilityLabel,
  testID,
}: AudioRecorderProps) {
  const { typography } = useTheme();

  const {
    isRecording,
    recordingTime,
    amplitude,
    scaleValue,
    startRecording,
    stopRecording,
    cancelRecording,
    formatTime
  } = useRecorder(onRecordingComplete, onCancel);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Audio recorder"}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={[styles.title, {
          fontSize: typography.heading3.fontSize,
          fontWeight: typography.heading3.fontWeight,
          lineHeight: typography.heading3.lineHeight,
          color: AppColors.textPrimary
        }]}>
          Voice Message
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.visualizer}>
          {Array.from({ length: 20 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: 10 + amplitude * (index % 5 === 0 ? 0.8 : 0.5),
                  backgroundColor: isRecording ? AppColors.primary : AppColors.textMuted,
                }
              ]}
            />
          ))}
        </View>

        <Text style={[styles.timer, {
          fontSize: typography.heading2.fontSize,
          fontWeight: typography.heading2.fontWeight,
          lineHeight: typography.heading2.lineHeight,
          color: AppColors.textPrimary
        }]}>
          {formatTime(recordingTime)}
        </Text>

        <Text style={[styles.instruction, {
          fontSize: typography.bodySmall.fontSize,
          lineHeight: typography.bodySmall.lineHeight,
          color: AppColors.textMuted
        }]}>
          {isRecording ? "Release to send" : "Hold to record"}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.cancelButton}
          onPress={cancelRecording}
          accessibilityLabel="Cancel recording"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={AppColors.textPrimary} />
        </Pressable>

        <Animated.View style={[
          styles.recordButtonContainer,
          { transform: [{ scale: scaleValue }] }
        ]}>
          <Pressable
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            accessibilityRole="button"
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={24} color={AppColors.textWhite} />
          </Pressable>
        </Animated.View>

        <Pressable
          style={styles.sendButton}
          onPress={stopRecording}
          disabled={!isRecording}
          accessibilityLabel="Send recording"
          accessibilityRole="button"
        >
          <Ionicons
            name="send"
            size={24}
            color={isRecording ? AppColors.primary : AppColors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}
const styles =StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    justifyContent: "space-between",
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  visualizer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 50,
    marginBottom: 16,
  },

  bar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
    backgroundColor: AppColors.textMuted,
  },

  timer: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginVertical: 8,
  },

  instruction: {
    fontSize: 14,
    color: AppColors.textMuted,
    textAlign: "center",
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
  },

  cancelButton: {
    padding: 12,
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  recordButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3, // shadow for Android
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  recordingButton: {
    backgroundColor: AppColors.red,
  },

  sendButton: {
    padding: 12,
    backgroundColor: AppColors.primary,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    opacity: 1,
  },

  disabledSendButton: {
    opacity: 0.5,
  },
});