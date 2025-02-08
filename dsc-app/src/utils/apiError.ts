interface ApiErrorData {
  msg: string;
}

interface ApiErrorResponse {
  data: ApiErrorData;
}

interface ApiError {
  response: ApiErrorResponse;
}

const isApiErrorData = (data: unknown): data is ApiErrorData => {
  return (
    typeof data === "object" &&
    data !== null &&
    "msg" in data &&
    typeof (data as ApiErrorData).msg === "string"
  );
};

const isApiErrorResponse = (
  response: unknown,
): response is ApiErrorResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    isApiErrorData((response as ApiErrorResponse).data)
  );
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    isApiErrorResponse((error as ApiError).response)
  );
};
