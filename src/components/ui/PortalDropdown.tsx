import React, {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface PortalDropdownProps {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  wrapperRef?: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
  portalId?: string;
  zIndex?: number;
  offset?: { top?: number; left?: number };
  children: ReactNode;
}

export function PortalDropdown({
  isOpen,
  anchorRef,
  wrapperRef,
  onClose,
  className = "",
  style = {},
  portalId,
  zIndex = 9999,
  offset,
  children,
}: PortalDropdownProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setAnchorRect(anchor.getBoundingClientRect());
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    const anchor = anchorRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && anchor
        ? new ResizeObserver(handleUpdate)
        : null;

    if (resizeObserver && anchor) {
      resizeObserver.observe(anchor);
    }

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      if (resizeObserver && anchor) {
        resizeObserver.unobserve(anchor);
        resizeObserver.disconnect();
      }
    };
  }, [isOpen, anchorRef, updatePosition]);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideAnchor = anchorRef.current?.contains(target);
      const insideWrapper = wrapperRef?.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideAnchor && !insideWrapper && !insidePortal) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose, anchorRef, wrapperRef]);

  if (!isOpen || !anchorRect) return null;

  const computedStyle: CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + (offset?.top ?? 0),
    left: anchorRect.left + (offset?.left ?? 0),
    width: anchorRect.width,
    zIndex,
    ...style,
  };

  return createPortal(
    <div ref={portalRef} id={portalId} className={className} style={computedStyle}>
      {children}
    </div>,
    document.body,
  );
}
