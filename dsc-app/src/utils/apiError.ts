type ApiError = {
  response?: {
    data?: {
      msg?: string;
    };
  };
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response !== null &&
    "data" in (error as any).response &&
    typeof (error as any).response.data === "object" &&
    (error as any).response.data !== null &&
    "msg" in (error as any).response.data
  );
};
