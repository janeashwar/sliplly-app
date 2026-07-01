import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface TabContextType {
  activeTabIndex: number;
  setActiveTab: (index: number) => void;
  setTabByName: (name: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

const TAB_NAMES = ['dashboard', 'trips', 'booking', 'calendar', 'more'];

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const setActiveTab = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveTabIndex(index);
  }, []);

  const setTabByName = useCallback((name: string) => {
    const index = TAB_NAMES.indexOf(name);
    if (index !== -1) {
      activeIndexRef.current = index;
      setActiveTabIndex(index);
    }
  }, []);

  return (
    <TabContext.Provider value={{ activeTabIndex, setActiveTab, setTabByName }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}
