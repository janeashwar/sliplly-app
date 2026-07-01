// Transition types for react-native-screen-transitions

export type TransitionDirection = 'top' | 'bottom' | 'left' | 'right';

export type BackdropBehavior = 'dismiss' | 'collapse' | 'none';

// Spring physics configuration
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}
