import React from "react";
import { Dialog } from "primereact/dialog";

interface ModalProps {
  visible: boolean;
  onHide?: () => void;
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
    onHide?.();
  };

  // Check if we should show the close icon
  const showCloseIcon = !!onHide || !!onClose;

  // Custom header content as ReactNode
  const customHeader = (
    <div className="border-bottom-1 surface-border flex w-full items-center justify-between p-4">
      <h5 className="m-0 text-xl font-medium">{header}</h5>
      <div className="flex items-center">
        {icons}
        {showCloseIcon && (
          <button
            className="p-dialog-header-icon p-link ml-2"
            onClick={handleHide}
            type="button"
            aria-label="Close"
          >
            <i className="pi pi-times" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      modal
      className={className}
      closeOnEscape={closeOnEscape && showCloseIcon}
      dismissableMask={!blockOutsideClick && showCloseIcon}
      showHeader={true}
      closable={false}
      header={customHeader}
    >
      {children}
    </Dialog>
  );
};
