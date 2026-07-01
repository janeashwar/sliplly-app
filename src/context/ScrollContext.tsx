/**
 * ScrollContext — Tracks scroll position for dynamic nav bar behavior
 * 
 * When at bottom of page: nav bar becomes opaque (no blur/transparency)
 * When scrolling up with content behind: nav bar becomes transparent with blur
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ScrollContextType {
  isAtBottom: boolean;
  scrollY: number;
  setScrollPosition: (y: number, contentHeight: number, layoutHeight: number) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  isAtBottom: false,
  scrollY: 0,
  setScrollPosition: () => {},
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const setScrollPosition = useCallback((y: number, contentHeight: number, layoutHeight: number) => {
    setScrollY(y);
    // Consider "at bottom" when within 50px of the bottom
    const threshold = 50;
    const isBottom = y + layoutHeight >= contentHeight - threshold;
    setIsAtBottom(isBottom);
  }, []);

  return (
    <ScrollContext.Provider value={{ isAtBottom, scrollY, setScrollPosition }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  return useContext(ScrollContext);
}
