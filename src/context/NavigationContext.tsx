import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationContextType {
  currentPage: string;
  previousPage: string;
  direction: 'left' | 'right' | 'none';
  navigateTo: (page: string) => void;
  goBack: () => void;
}

const PAGE_ORDER = ['dashboard', 'trips', 'booking', 'calendar'];

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [previousPage, setPreviousPage] = useState('dashboard');
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');

  const navigateTo = useCallback((page: string) => {
    if (page === currentPage) return;

    const currentIndex = PAGE_ORDER.indexOf(currentPage);
    const newIndex = PAGE_ORDER.indexOf(page);
    const dir = newIndex > currentIndex ? 'right' : 'left';

    setPreviousPage(currentPage);
    setDirection(dir);
    setCurrentPage(page);
  }, [currentPage]);

  const goBack = useCallback(() => {
    if (previousPage) {
      const currentIndex = PAGE_ORDER.indexOf(currentPage);
      const prevIndex = PAGE_ORDER.indexOf(previousPage);
      const dir = prevIndex > currentIndex ? 'right' : 'left';

      setDirection(dir);
      setCurrentPage(previousPage);
      setPreviousPage(currentPage);
    }
  }, [currentPage, previousPage]);

  return (
    <NavigationContext.Provider
      value={{ currentPage, previousPage, direction, navigateTo, goBack }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
