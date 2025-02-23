import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/actions/useAuth";
import { Message } from "@/components/Common";
import { Button } from "primereact/button";
import { ApiError } from "@/types/api";

type MessageType = "success" | "error" | "warn" | "info";

const AccountActivation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { activateAccount, isLoading, error } = useAuth();
  const [progress, setProgress] = useState(0);
  const activationAttempted = useRef(false);

  const handleRedirect = (message: string, type: MessageType) => {
    setProgress(100);
    setTimeout(() => {
      navigate("/login", {
        replace: true,
        state: { message, type },
      });
    }, 500);
  };

  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleActivation = async () => {
      if (!token || isLoading || activationAttempted.current) return;

      activationAttempted.current = true;

      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      try {
        const response = await activateAccount(token);

        if (!response.success && response.msg) {
          handleRedirect(
            response.msg || "Account activation failed. Please try again.",
            "error",
          );
          return;
        }
        handleRedirect(
          response.msg || "Account activated successfully.",
          "info",
        );
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = apiError.response?.data.msg || "Activation failed";
        handleRedirect(errorMessage, "error");
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
        }
      }
    };

    handleActivation();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [token, activateAccount, navigate, isLoading]);

  if (error) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center space-y-8">
        <Message
          message={error instanceof Error ? error.message : "Activation failed"}
          type="error"
          useTransition={false}
        />
        <Button
          type="button"
          label="Go to Login"
          size="small"
          rounded
          onClick={() => navigate("/login", { replace: true })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h2 className="mb-4 text-center text-xl font-bold text-indigo-500">
          Activating Your Account
        </h2>
        <div className="mb-4">
          <div className="relative pt-1">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-blue-200 px-2 py-1 text-xs font-semibold text-blue-600 uppercase">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs font-semibold text-blue-600">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="mb-4 flex h-2 overflow-hidden rounded bg-blue-200 text-xs">
              <div
                style={{ width: `${progress}%` }}
                className="flex flex-col justify-center bg-blue-500 text-center whitespace-nowrap text-white shadow-none transition-all duration-500 ease-in-out"
              ></div>
            </div>
          </div>
        </div>
        <p className="text-center text-gray-600">
          Please wait while we activate your account...
        </p>
      </div>
    </div>
  );
};

export default AccountActivation;
