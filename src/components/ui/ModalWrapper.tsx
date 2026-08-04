import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MODAL_SIZES, MODAL_COMMON } from '../../constants/designSystem';

export type ModalSize = keyof typeof MODAL_SIZES;

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeButton?: boolean;
  className?: string;
  contentClassName?: string;
}

const MODAL_ROOT_ID = 'modal-root';
let openModalCount = 0;
let previousBodyOverflow = '';
let previousBodyPaddingRight = '';

function lockBodyScroll() {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  openModalCount += 1;
}

function unlockBodyScroll() {
  openModalCount = Math.max(openModalCount - 1, 0);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}

function getOrCreateModalRoot(): HTMLElement {
  let root = document.getElementById(MODAL_ROOT_ID) as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = MODAL_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

/**
 * ModalWrapper Component
 *
 * Standardizes all dialog surfaces across the application.
 * Uses a document body portal so modals escape any nested stacking context or transformed parent.
 *
 * Ensures:
 * - Consistent portal-based stacking across the app
 * - Scroll lock without layout shift
 * - Consistent backdrop and content sizing
 */
export function ModalWrapper({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeButton = true,
  className = '',
  contentClassName = '',
}: ModalWrapperProps) {
  const sizeConfig = MODAL_SIZES[size];
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = getOrCreateModalRoot();
    setModalRoot(root);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !modalRoot) return null;

  return createPortal(
    <div
      className={`${MODAL_COMMON.backdrop}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        className={`${MODAL_COMMON.overlay}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            `${sizeConfig.width} ${sizeConfig.height} mx-auto flex min-h-0 flex-col overflow-hidden ${MODAL_COMMON.container} ${className}`
          }
          onClick={(e) => e.stopPropagation()}
        >
          {(title || closeButton) && (
            <div className="flex-shrink-0 flex items-start justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              {title ? (
                <div>
                  <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  {description && (
                    <p id="modal-description" className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              ) : null}
              {closeButton && (
                <button onClick={onClose} className={MODAL_COMMON.closeButton} aria-label="Close modal">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${sizeConfig.padding} ${contentClassName}`}>
            {children}
          </div>

          {footer ? (
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/30">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
