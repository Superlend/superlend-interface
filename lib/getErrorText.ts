import {
  SOMETHING_WENT_WRONG_MESSAGE,
  TRANSACTION_CANCEL_TEXT,
} from "../constants";

export const getErrorText = (error: { message: string }) => {
  if (typeof error.message !== "string") {
    return SOMETHING_WENT_WRONG_MESSAGE;
  }
  if (error.message.includes("User rejected the request")) {
    return TRANSACTION_CANCEL_TEXT;
  }
  return SOMETHING_WENT_WRONG_MESSAGE;
};
