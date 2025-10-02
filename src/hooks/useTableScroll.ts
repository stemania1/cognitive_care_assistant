import { useEffect, useState } from 'react';

export function useTableScroll(tableId: string) {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest(`#${tableId}`)) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          table.scrollBy({ top: -50, behavior: 'smooth' });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          table.scrollBy({ top: 50, behavior: 'smooth' });
        }
      }
    };

    const handleScroll = () => {
      const table = document.getElementById(tableId);
      if (table) {
        const scrollTop = table.scrollTop;
        const scrollHeight = table.scrollHeight - table.clientHeight;
        const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollPosition(scrollPercent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Add scroll listener to the table
    const table = document.getElementById(tableId);
    if (table) {
      table.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (table) {
        table.removeEventListener('scroll', handleScroll);
      }
    };
  }, [tableId]);

  const scrollUp = () => {
    const table = document.getElementById(tableId);
    if (table) {
      table.scrollBy({ top: -50, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    const table = document.getElementById(tableId);
    if (table) {
      table.scrollBy({ top: 50, behavior: 'smooth' });
    }
  };

  return {
    scrollPosition,
    scrollUp,
    scrollDown
  };
}
