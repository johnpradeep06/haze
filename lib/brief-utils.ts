/**
 * Calculate customer price from designer quote (adds 25% platform fee)
 */
export function calculateCustomerPrice(designerQuote: number): number {
    return Math.round(designerQuote * 1.25);
}

/**
 * Calculate platform fee (20% of customer price)
 */
export function calculatePlatformFee(customerPrice: number): number {
    return Math.round(customerPrice * 0.2);
}

/**
 * Calculate designer earning (80% of customer price)
 */
export function calculateDesignerEarning(customerPrice: number): number {
    return Math.round(customerPrice * 0.8);
}
