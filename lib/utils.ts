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
