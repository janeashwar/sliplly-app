/**
 * Confetti — Particle celebration effect using Reanimated
 * Spawns colorful confetti pieces that fall with physics.
 * Used on booking completion, achievements, etc.
 */
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#d6ed6a', '#34D399', '#FBBF24', '#60A5FA',
  '#EF4444', '#A78BFA', '#F472B6', '#FB923C',
];

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  delay: number;
  size: number;
  rotation: number;
  swayAmount: number;
  fallSpeed: number;
}

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 400,
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 720 - 360,
    swayAmount: Math.random() * 80 - 40,
    fallSpeed: Math.random() * 800 + 1200,
  }));
}

function ConfettiPieceView({ piece, onComplete }: { piece: ConfettiPiece; onComplete: () => void }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(piece.startX);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Scale in
    scale.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
    );

    // Fall down
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: piece.fallSpeed,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Sway
    translateX.value = withDelay(
      piece.delay,
      withTiming(piece.startX + piece.swayAmount, {
        duration: piece.fallSpeed,
        easing: Easing.inOut(Easing.sin),
      })
    );

    // Spin
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation, {
        duration: piece.fallSpeed,
        easing: Easing.linear,
      })
    );

    // Fade out near end
    opacity.value = withDelay(
      piece.delay + piece.fallSpeed * 0.7,
      withTiming(0, { duration: piece.fallSpeed * 0.3 })
    );

    const timer = setTimeout(() => onComplete(), piece.delay + piece.fallSpeed + 100);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.size * 0.6,
          borderRadius: 2,
          backgroundColor: piece.color,
        },
        animStyle,
      ]}
    />
  );
}

interface ConfettiProps {
  visible: boolean;
  count?: number;
  onComplete?: () => void;
}

export default function Confetti({ visible, count = 40, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);
  const completedRef = React.useRef(0);

  useEffect(() => {
    if (visible) {
      completedRef.current = 0;
      setPieces(generatePieces(count));
    } else {
      setPieces([]);
    }
  }, [visible, count]);

  const handlePieceComplete = useCallback(() => {
    completedRef.current += 1;
    if (completedRef.current >= pieces.length) {
      onComplete?.();
      setPieces([]);
    }
  }, [pieces.length, onComplete]);

  if (!visible || pieces.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceView
          key={piece.id}
          piece={piece}
          onComplete={handlePieceComplete}
        />
      ))}
    </View>
  );
}
