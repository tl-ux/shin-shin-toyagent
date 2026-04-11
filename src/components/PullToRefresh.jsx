import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const THRESHOLD = 72;

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPulling(true);
      setPullY(Math.min(delta * 0.4, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    setPulling(false);
    setPullY(0);
  }, [pullY, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center transition-all pointer-events-none z-10"
        style={{ height: pullY, overflow: 'hidden' }}
      >
        <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${(pullY / THRESHOLD) * 360}deg)` }}
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div style={{ transform: `translateY(${pullY}px)`, transition: pulling ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
}