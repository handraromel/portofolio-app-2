import React from "react";
import { Dialog } from "primereact/dialog";

interface ModalProps {
  visible: boolean;
  onHide: () => void;
  header: string;
  children: React.ReactNode;
  className?: string;
  icons?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onHide,
  header,
  children,
  className,
  icons,
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
      icons={icons}
    >
      {children}
    </Dialog>
  );
};
