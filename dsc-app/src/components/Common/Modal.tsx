import React from "react";
import { Dialog } from "primereact/dialog";

interface ModalProps {
  visible: boolean;
  onHide: () => void;
  onClose?: () => void;
  header: string;
  children: React.ReactNode;
  className?: string;
  icons?: React.ReactNode;
  blockOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onHide,
  onClose,
  header,
  children,
  className,
  icons,
  blockOutsideClick = false,
  closeOnEscape = false,
}) => {
  const handleHide = () => {
    onClose?.();
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={header}
      modal
      className={className}
      closeOnEscape={closeOnEscape}
      dismissableMask={!blockOutsideClick}
      icons={icons}
    >
      {children}
    </Dialog>
  );
};
