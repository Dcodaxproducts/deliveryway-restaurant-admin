import type { ClipboardEvent, KeyboardEvent } from "react";

const INVALID_NUMBER_KEYS = new Set(["-", "+", "e", "E"]);

export const blockInvalidNumberKeys = (event: KeyboardEvent<HTMLInputElement>) => {
  if (INVALID_NUMBER_KEYS.has(event.key)) {
    event.preventDefault();
  }
};

export const blockNegativeNumberPaste = (event: ClipboardEvent<HTMLInputElement>) => {
  const pastedValue = event.clipboardData.getData("text");

  if (pastedValue.includes("-") || Number(pastedValue) < 0) {
    event.preventDefault();
  }
};

export const sanitizeNonNegativeNumber = (value: string) => {
  if (value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "";
  }

  if (numericValue < 0) {
    return "0";
  }

  return value;
};
