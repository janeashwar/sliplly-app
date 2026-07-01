// Transition Stack — Bridge between expo-router and react-native-screen-transitions
// This replaces the default Stack with a blank stack that gives us full control
// over how screens open, close, and react when another screen comes on top.

import { withLayoutContext } from 'expo-router';
import { createBlankStackNavigator } from 'react-native-screen-transitions/blank-stack';

const { Navigator } = createBlankStackNavigator();

// This bridges the blank stack with expo-router's file-based routing
// expo-router still controls WHICH screen loads, we control HOW it animates
export const TransitionStack = withLayoutContext(Navigator);
