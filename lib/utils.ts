import { Period } from "@/types/periodButtons";
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
};

export function extractTimeFromDate(date: Date, options: TOptions = {}) {
  const { exclude } = options;

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12; // Convert to 12-hour format
  hours = hours ? hours : 12; // The hour '0' should be '12'

  const hasHours = !exclude?.includes("hours") ? `${hours}` : "";
  const hasMinutes = !exclude?.includes("minutes") ? `:${minutes}` : "";
  const hasSeconds = !exclude?.includes("seconds") ? `:${seconds}` : "";

  return `${hasHours}${hasMinutes}${hasSeconds} ${ampm}`;
}

export function formatDateAccordingToPeriod(
  timeStamp: string,
  selectedRange: Period
) {
  const day = timeStamp.slice(4, 6).split(",")[0];
  const month = timeStamp.slice(0, 3);
  const date = `${day} ${month}`;

  const result = selectedRange === Period.oneDay ? timeStamp : date;
  return result;
}

export const shortNubers = (value: number): number => {
  const parts = value.toString().split(".");

  if (parts.length === 1) {
    return value;
  }

  const integerPart = parts[0];
  const fractionalPart = parts[1];

  let significantCount = 0;
  let trimmedFractional = "";
  let firstNotZero = false;
  for (let i = 0; i < fractionalPart.length; i++) {
    trimmedFractional += fractionalPart[i];
    if (Number(fractionalPart[i]) > 0) {
      firstNotZero = true;
    }
    if (firstNotZero) {
      significantCount++;
    }
    if (significantCount === 3) {
      break;
    }
  }

  const result = parseFloat(integerPart + "." + trimmedFractional);

  return result;
};

export function getTokenLogo(tokenSymbol: string): string {
  return `https://app.aave.com/icons/tokens/${tokenSymbol?.toLowerCase()}.svg`;
}

export function getPlatformLogo(platformName: string): string {
  return `/images/platforms/${platformName?.toLowerCase()}.webp`;
}

/**
 * Extracts the version string subset from a hyphen-delimited platform name, 
 * having version string subset on 1st index position.
 * 
 * @param {string} platformName - The hyphen-delimited platform name.
 * @returns {string} The extracted version string subset or an empty string if not found.
 * 
 * Example:
 * - If platformName is "AAVE-V3-ETHEREUM", returns "V3".
 * - If platformName is "FLUID-ETHEREUM", returns an empty string.
 */
export function getPlatformVersion(platformName: string): string {
  const versionMatch = platformName?.split("-")[1]?.toLowerCase()?.match(/v2|v3|v\d+/);
  return versionMatch ? versionMatch[0].toUpperCase() : "";
}

export function capitalizeText(text: string) {
  return `${text.split("-")[0][0]}${text.split("-")[0].slice(1).toLowerCase()}`;
}