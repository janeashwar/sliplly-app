/**
 * CachedImage — Optimized image component using expo-image
 *
 * Features:
 * - Automatic disk caching
 * - Blurhash placeholder support
 * - Fade-in transition
 * - Memory-efficient (recycled offscreen)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageContentFit, ImageSource } from 'expo-image';

interface CachedImageProps {
  source: string | { uri: string };
  style?: ViewStyle;
  contentFit?: ImageContentFit;
  placeholder?: string; // blurhash string
  transition?: number; // ms fade duration
  cachePolicy?: 'memory' | 'memory-disk' | 'disk' | 'none';
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  onLoad?: () => void;
  onError?: (event: Parameters<NonNullable<React.ComponentProps<typeof Image>['onError']>>[0]) => void;
}

export default function CachedImage({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 300,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  recyclingKey,
  onLoad,
  onError,
}: CachedImageProps) {
  const imageSource: ImageSource = typeof source === 'string'
    ? { uri: source }
    : source;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        placeholder={placeholder ? { blurhash: placeholder } : undefined}
        transition={transition}
        cachePolicy={cachePolicy}
        priority={priority}
        recyclingKey={recyclingKey}
        onLoad={onLoad}
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
