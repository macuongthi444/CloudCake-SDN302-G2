import { createPortal } from 'react-dom';
import React from 'react';

const modalRootId = 'modal-root';

function ensureModalRoot() {
  let root = document.getElementById(modalRootId);
  if (!root) {
    root = document.createElement('div');
    root.id = modalRootId;
    document.body.appendChild(root);
  }
  return root;
}

const ModalPortal = ({ children }) => {
  const root = ensureModalRoot();
  return createPortal(children, root);
};

export default ModalPortal;


