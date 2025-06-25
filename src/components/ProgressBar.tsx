import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  textColor?: string;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = 8,
  backgroundColor = '#E0E0E0',
  progressColor = '#4CAF50',
  textColor = '#333333',
  showLabel = false,
  label,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const percentageText = `${Math.round(clampedProgress)}%`;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>
            {label || 'Progress'}
          </Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: textColor }]}>
              {percentageText}
            </Text>
          )}
        </View>
      )}
      
      <View style={[styles.progressContainer, { height, backgroundColor }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: progressColor,
              height,
            },
          ]}
        />
      </View>
      
      {!showLabel && showPercentage && (
        <Text style={[styles.percentage, { color: textColor }]}>
          {percentageText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
}); 