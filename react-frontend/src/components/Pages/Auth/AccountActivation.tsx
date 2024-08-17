import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "hooks/useStore";
import { activateAccount } from "store/actions/authActions";
import {
  setActivationProgress,
  clearActivationState,
} from "store/slices/authSlice";
import { Message, Button } from "components/Common";

const AccountActivation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, message } = useAppSelector((state) => state.auth);
  const [activationAttempted, setActivationAttempted] = useState(false);
  const [progress, setProgress] = useState(0);

  const activate = useCallback(async () => {
    if (token && !isLoading && !activationAttempted) {
      setActivationAttempted(true);
      try {
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = Math.min(prev + 10, 90);
            dispatch(setActivationProgress(newProgress));
            return newProgress;
          });
        }, 500);

        await dispatch(activateAccount(token)).unwrap();

        clearInterval(progressInterval);
        setProgress(100);
        dispatch(setActivationProgress(100));

        setTimeout(() => {
          dispatch(clearActivationState());
          navigate("/login", {
            state: {
              message: "Account activated successfully. Please log in.",
            },
          });
        }, 1000);
      } catch (err) {
        setProgress(100);
        dispatch(setActivationProgress(100));
      }
    }
  }, [token, dispatch, navigate, isLoading, activationAttempted]);

  useEffect(() => {
    activate();
  }, [activate]);

  useEffect(() => {
    return () => {
      dispatch(clearActivationState());
    };
  }, [dispatch]);

  if (message?.type === "error") {
    return (
      <div className="mt-8 flex flex-col items-center justify-center space-y-8">
        <Message message={message.text} type="error" useTransition={false} />
        <Button
          type="button"
          buttonText="Return to Login"
          onClick={() => {
            dispatch(clearActivationState());
            navigate("/login");
          }}
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
                <span className="inline-block rounded-full bg-blue-200 px-2 py-1 text-xs font-semibold uppercase text-blue-600">
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
                className="flex flex-col justify-center whitespace-nowrap bg-blue-500 text-center text-white shadow-none transition-all duration-500 ease-in-out"
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
