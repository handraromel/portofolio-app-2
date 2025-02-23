import React, { useEffect, useRef } from "react";
import { Messages } from "primereact/messages";

interface MessageProps {
  message: string;
  type: "success" | "error" | "warn" | "info";
  useTransition?: boolean;
}

export const Message: React.FC<MessageProps> = ({
  message,
  type,
  useTransition = true,
}) => {
  const msgs = useRef<Messages>(null);

  useEffect(() => {
    if (msgs.current) {
      msgs.current.clear();
      msgs.current.show({
        severity: type,
        detail: message,
        sticky: !useTransition,
        life: useTransition ? 5000 : undefined,
        closable: false,
      });
    }
  }, [message, type, useTransition]);

  return <Messages ref={msgs} />;
};
