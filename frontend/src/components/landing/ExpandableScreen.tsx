import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ExpandableScreenContextValue {
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  layoutId: string;
  triggerRadius: string;
  contentRadius: string;
  animationDuration: number;
}

const ExpandableScreenContext = createContext<ExpandableScreenContextValue | null>(null);

export function useExpandableScreen() {
  const context = useContext(ExpandableScreenContext);
  if (!context) throw new Error('useExpandableScreen must be used within an ExpandableScreen');
  return context;
}

interface ExpandableScreenProps {
  children: ReactNode;
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  layoutId?: string;
  triggerRadius?: string;
  contentRadius?: string;
  animationDuration?: number;
  lockScroll?: boolean;
}

export function ExpandableScreen({
  children,
  defaultExpanded = false,
  onExpandChange,
  layoutId = 'expandable-card',
  triggerRadius = '100px',
  contentRadius = '24px',
  animationDuration = 0.35,
  lockScroll = true,
}: ExpandableScreenProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const expand = () => { setIsExpanded(true); onExpandChange?.(true); };
  const collapse = () => { setIsExpanded(false); onExpandChange?.(false); };

  useEffect(() => {
    if (!lockScroll) return;
    document.body.style.overflow = isExpanded ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded, lockScroll]);

  return (
    <ExpandableScreenContext.Provider value={{ isExpanded, expand, collapse, layoutId, triggerRadius, contentRadius, animationDuration }}>
      {children}
    </ExpandableScreenContext.Provider>
  );
}

interface ExpandableScreenTriggerProps {
  children: ReactNode;
  className?: string;
}

export function ExpandableScreenTrigger({ children, className = '' }: ExpandableScreenTriggerProps) {
  const { isExpanded, expand, layoutId, triggerRadius } = useExpandableScreen();
  return (
    <AnimatePresence initial={false}>
      {!isExpanded && (
        <motion.div className={`relative inline-block ${className}`}>
          <motion.div
            style={{ borderRadius: triggerRadius }}
            layout
            layoutId={layoutId}
            className="absolute inset-0 transform-gpu will-change-transform"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2 }}
            layout={false}
            onClick={expand}
            className="relative cursor-pointer"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ExpandableScreenContentProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
}

export function ExpandableScreenContent({
  children,
  className = '',
  showCloseButton = true,
  closeButtonClassName = '',
}: ExpandableScreenContentProps) {
  const { isExpanded, collapse, layoutId, contentRadius, animationDuration } = useExpandableScreen();
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            layoutId={layoutId}
            transition={{ duration: animationDuration }}
            style={{ borderRadius: contentRadius }}
            layout
            className={`relative flex h-full w-full overflow-y-auto transform-gpu will-change-transform ${className}`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="relative z-20 w-full"
            >
              {children}
            </motion.div>
            {showCloseButton && (
              <motion.button
                onClick={collapse}
                className={`absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  closeButtonClassName || 'bg-white/10 text-[#d8e3fb] hover:bg-white/20'
                }`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
