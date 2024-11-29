import React from 'react';
import { IHeadingTextProps, IBodyTextProps, ILabelProps } from '../../interfaces/ui/ITypography';

const COMMON_STYLES = "";

const hasValidHeadingLevel = (level: string): level is "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
    return ["h1", "h2", "h3", "h4", "h5", "h6"].includes(level);
}

const getHeadingLevel = (level: string) => {
    if (hasValidHeadingLevel(level)) {
        return level;
    }
    return "h1";
}

const headingSizes: Record<string, string> = {
    h1: "text-[24px] md:text-[28px] lg:text-[32px]",
    h2: "text-[20px] md:text-[24px] lg:text-[28px]",
    h3: "text-[16px] md:text-[20px] lg:text-[24px]",
    h4: "text-[16px] md:text-[18px] lg:text-[20px]",
    h5: "text-[16px]",
    h6: "text-[12px]",
}

const fontWeights: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
}

const getHeadingClassName = (level: IHeadingTextProps["level"] = "h1", weight: IHeadingTextProps["weight"] = "bold", className: string = "") => {
    return `${headingSizes[level]} ${fontWeights[weight]} ${COMMON_STYLES} ${className}`;
}

export function HeadingText({ children, level = "h1", weight = "bold", className }: IHeadingTextProps) {
    const headingLevel = getHeadingLevel(level);
    return (
        <>
            {headingLevel === "h1" && <h1 className={getHeadingClassName(level, weight, className)}>{children}</h1>}
            {headingLevel === "h2" && <h2 className={getHeadingClassName(level, weight, className)}>{children}</h2>}
            {headingLevel === "h3" && <h3 className={getHeadingClassName(level, weight, className)}>{children}</h3>}
            {headingLevel === "h4" && <h4 className={getHeadingClassName(level, weight, className)}>{children}</h4>}
            {headingLevel === "h5" && <h5 className={getHeadingClassName(level, weight, className)}>{children}</h5>}
            {headingLevel === "h6" && <h6 className={getHeadingClassName(level, weight, className)}>{children}</h6>}
        </>
    )
}

// ========================================================================================================

const bodySizes: Record<string, string> = {
    body1: "text-[14px] sm:text-[16px]",
    body2: "text-[12px] sm:text-[14px]",
    body3: "text-[12px]",
}

const getBodyClassName = (level: IBodyTextProps["level"] = "body1", weight: IBodyTextProps["weight"] = "normal", className: string = "") => {
    return `${bodySizes[level]} ${fontWeights[weight]} ${COMMON_STYLES} ${className}`;
}

export function BodyText({ children, level, weight, className }: IBodyTextProps) {
    return (
        <p className={getBodyClassName(level, weight, className)}>{children}</p>
    )
}

// ========================================================================================================

const labelSizes: Record<string, string> = {
    small: "text-[12px]",
    medium: "text-[14px]",
    large: "text-[16px]",
}

const getLabelClassName = (size: ILabelProps["size"] = "small", weight: ILabelProps["weight"] = "normal", className: string = "") => {
    return `${labelSizes[size]} ${fontWeights[weight]} ${COMMON_STYLES} ${className}`;
}

export function Label({ children, size, weight, className, htmlFor = "", ...props }: ILabelProps) {
    return (
        <label className={getLabelClassName(size, weight, className)} htmlFor={htmlFor} {...props}>{children}</label>
    )
}