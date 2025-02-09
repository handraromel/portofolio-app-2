import React from "react";
import { Dialog } from "primereact/dialog";

interface ModalProps {
  visible: boolean;
  onHide: () => void;
  header: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onHide,
  header,
  children,
  className,
}) => {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      modal
      className={className}
      closeOnEscape
      dismissableMask
    >
      {children}
    </Dialog>
  );
};

export default Modal;
