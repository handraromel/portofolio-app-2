import { ConfirmDialog } from "primereact/confirmdialog";

interface ConfirmationProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  message: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
}

export const Confirmation = ({
  visible,
  onHide,
  onConfirm,
  message,
  header = "Confirmation",
  icon = "pi pi-exclamation-triangle",
  acceptLabel = "Yes",
  rejectLabel = "No",
}: ConfirmationProps) => {
  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      message={message}
      header={header}
      icon={icon}
      acceptLabel={acceptLabel}
      rejectLabel={rejectLabel}
      accept={onConfirm}
      reject={onHide}
    />
  );
};
