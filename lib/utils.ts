import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function containsNegativeInteger(str: string): boolean {
  // Regular expression to match negative integers
  const negativeIntegerPattern = /-\d+/;

  // Test the string against the pattern
  return negativeIntegerPattern.test(str);
}

export function convertNegativeToPositive(str: string): string {
  // Regular expression to match negative integers
  const negativeIntegerPattern = /(-\d+)/g;

  // Replace negative integers with their positive counterparts
  return str.toString().replace(negativeIntegerPattern, (match) => {
    return Math.abs(parseInt(match, 10)).toString();
  });
}

export const abbreviateNumber = (value: number): string => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2) + "B";
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + "K";
  } else {
    return value.toFixed(2).toString();
  }
};

type TOptions = {
  exclude?: string[];
  include?: string[];
};

export function convertDateToTime(date: Date, options: TOptions = {}) {
  const { exclude } = options;
  // Ensure the input is a Date object
  if (!(date instanceof Date)) {
    throw new Error("Input must be a Date object");
  }

  // Extract hours, minutes, and seconds
  const hours = date.getHours().toString().padStart(2, "0"); // Format: HH
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Format: MM
  const seconds = date.getSeconds().toString().padStart(2, "0"); // Format: SS

  const hasHours = !exclude?.includes("hours") ? `${hours}` : "";
  const hasMinutes = !exclude?.includes("minutes") ? `:${minutes}` : "";
  const hasSeconds = !exclude?.includes("seconds") ? `:${seconds}` : "";

  // Return formatted time string
  return `${hasHours}${hasMinutes}${hasSeconds}`;
}

export function getTokenLogo(tokenSymbol: string): string {
  return `https://app.aave.com/icons/tokens/${tokenSymbol?.toLowerCase()}.svg`;
}

export function getPlatformLogo(platformName: string): string {
  return `/images/platforms/${platformName?.toLowerCase()}.webp`;
}
