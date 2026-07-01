/**
 * DragToReorder — Long-press-to-drag list reordering
 *
 * Uses react-native-gesture-handler + reanimated for smooth drag.
 * Animated placeholder shows where item will drop.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { hapticMedium } from '../../utils/haptics';

interface DragToReorderProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  onReorder: (newItems: T[]) => void;
  keyExtractor: (item: T) => string;
  itemHeight: number;
  gap?: number;
}

const SPRING_CONFIG = { stiffness: 200, damping: 20, mass: 0.8 };

export default function DragToReorder<T>({
  items,
  renderItem,
  onReorder,
  keyExtractor,
  itemHeight,
  gap = 12,
}: DragToReorderProps<T>) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const translateY = useSharedValue(0);
  const activeIndex = useSharedValue(-1);
  const itemPositions = useRef<number[]>([]);

  const totalItemHeight = itemHeight + gap;

  // Calculate positions on layout
  const handleLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      itemPositions.current[index] = index * totalItemHeight;
    },
    [totalItemHeight]
  );

  const handleDragStart = useCallback(
    (index: number) => {
      'worklet';
      activeIndex.value = index;
      translateY.value = 0;
      runOnJS(setDraggingIndex)(index);
      runOnJS(hapticMedium)();
    },
    []
  );

  const handleDragMove = useCallback(
    (translationY: number) => {
      'worklet';
      translateY.value = translationY;

      // Calculate the new position based on drag
      const currentY = activeIndex.value * totalItemHeight + translationY;
      const newIndex = Math.round(currentY / totalItemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));

      if (clampedIndex !== activeIndex.value) {
        activeIndex.value = clampedIndex;
      }
    },
    [items.length, totalItemHeight]
  );

  const handleDragEnd = useCallback(
    () => {
      'worklet';
      const newIndex = activeIndex.value;
      translateY.value = withTiming(0, { duration: 200 });
      runOnJS(setDraggingIndex)(null);

      if (draggingIndex !== null && newIndex !== draggingIndex && newIndex >= 0 && newIndex < items.length) {
        const newItems = [...items];
        const [removed] = newItems.splice(draggingIndex, 1);
        newItems.splice(newIndex, 0, removed);
        runOnJS(onReorder)(newItems);
      }
    },
    [draggingIndex, items, onReorder]
  );

  const dragGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      'worklet';
      // We need the index from context - will be set per item
    });

  return (
    <View>
      {items.map((item, index) => (
        <DraggableItem
          key={keyExtractor(item)}
          item={item}
          index={index}
          isDragging={draggingIndex === index}
          renderItem={renderItem}
          onLayout={(e) => handleLayout(index, e)}
          itemHeight={itemHeight}
          gap={gap}
          totalItemHeight={totalItemHeight}
          itemsCount={items.length}
          draggingIndex={draggingIndex}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          translateY={translateY}
          activeIndex={activeIndex}
        />
      ))}
    </View>
  );
}

interface DraggableItemProps<T> {
  item: T;
  index: number;
  isDragging: boolean;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  onLayout: (event: LayoutChangeEvent) => void;
  itemHeight: number;
  gap: number;
  totalItemHeight: number;
  itemsCount: number;
  draggingIndex: number | null;
  onDragStart: (index: number) => void;
  onDragMove: (translationY: number) => void;
  onDragEnd: () => void;
  translateY: SharedValue<number>;
  activeIndex: SharedValue<number>;
}

function DraggableItem<T>({
  item,
  index,
  isDragging,
  renderItem,
  onLayout,
  itemHeight,
  gap,
  totalItemHeight,
  itemsCount,
  draggingIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
  translateY,
  activeIndex,
}: DraggableItemProps<T>) {
  const gestureActive = useSharedValue(false);

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      gestureActive.value = true;
      onDragStart(index);
    })
    .onEnd(() => {
      gestureActive.value = false;
      onDragEnd();
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, stateManager) => {
      if (gestureActive.value) {
        stateManager.activate();
      }
    })
    .onUpdate((event) => {
      if (gestureActive.value) {
        onDragMove(event.translationY);
      }
    })
    .onEnd(() => {
      gestureActive.value = false;
      onDragEnd();
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const animatedStyle = useAnimatedStyle(() => {
    const isItemDragging = activeIndex.value === index && gestureActive.value;
    return {
      transform: [{ translateY: isItemDragging ? translateY.value : 0 }],
      zIndex: isItemDragging ? 100 : 1,
      opacity: isItemDragging ? 0.9 : 1,
      elevation: isItemDragging ? 8 : 0,
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        onLayout={onLayout}
        style={[
          { marginBottom: gap, height: itemHeight },
          animatedStyle,
        ]}
      >
        {renderItem(item, index, isDragging)}
      </Animated.View>
    </GestureDetector>
  );
}
