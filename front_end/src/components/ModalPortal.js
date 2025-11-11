import { createPortal } from 'react-dom';
import React, { useEffect, useRef } from 'react';

const modalRootId = 'modal-root';

function ensureModalRoot() {
  let root = document.getElementById(modalRootId);
  if (!root) {
    root = document.createElement('div');
    root.id = modalRootId;
    // Make sure modal root sits above any app headers/sidebars
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '2147483000';
    root.style.pointerEvents = 'none'; // container ignores events; children decide
    document.body.appendChild(root);
  }
  return root;
}

const ModalPortal = ({ children }) => {
  const root = ensureModalRoot();
  const prevOverflowRef = useRef(null);

  useEffect(() => {
    // Lock body scroll while modal is open
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflowRef.current || '';
    };
  }, []);

  // Wrap children so they can receive pointer events and sit on top
  const wrapper = (
    <div
      className="modal-portal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483600,
        pointerEvents: 'auto'
      }}
    >
      {children}
    </div>
  );

  return createPortal(wrapper, root);
};

export default ModalPortal;


