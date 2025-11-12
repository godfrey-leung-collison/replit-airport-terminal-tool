export interface LoungeVisitData {
  loungeCode: string;
  visitHour: Date;
  totalVisits: number;
}

export interface LoungeMapping {
  loungeName: string;
  loungeCode: string;
  isAd: boolean;
}

/**
 * Parse CSV data into structured visit data
 */
export function parseVisitData(csvText: string): LoungeVisitData[] {
  const lines = csvText.trim().split("\n");
  const data: LoungeVisitData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length >= 3) {
      data.push({
        loungeCode: parts[0].trim(),
        visitHour: new Date(parts[1].trim()),
        totalVisits: parseInt(parts[2].trim(), 10),
      });
    }
  }

  return data;
}

/**
 * Parse lounge mapping JSON
 */
export function parseLoungeMapping(mappingJson: Record<string, { LOUNGE_CODE: string; is_AD: boolean }>): LoungeMapping[] {
  return Object.entries(mappingJson).map(([name, data]) => ({
    loungeName: name,
    loungeCode: data.LOUNGE_CODE,
    isAd: data.is_AD,
  }));
}

/**
 * Get visit data for a specific hour
 */
export function getVisitDataForHour(
  allData: LoungeVisitData[],
  targetDateTime: Date
): Map<string, number> {
  const visitMap = new Map<string, number>();

  // Normalize target date to hour precision
  const targetHour = new Date(targetDateTime);
  targetHour.setMinutes(0, 0, 0);

  for (const record of allData) {
    const recordHour = new Date(record.visitHour);
    recordHour.setMinutes(0, 0, 0);

    if (recordHour.getTime() === targetHour.getTime()) {
      visitMap.set(record.loungeCode, record.totalVisits);
    }
  }

  return visitMap;
}

/**
 * Find lounge code by name (case-insensitive, fuzzy matching)
 */
export function findLoungeCodeByName(
  loungeName: string,
  mappings: LoungeMapping[]
): string | null {
  const normalizedName = loungeName.toLowerCase().trim();

  // Try exact match first
  for (const mapping of mappings) {
    if (mapping.loungeName.toLowerCase().trim() === normalizedName) {
      return mapping.loungeCode;
    }
  }

  // Try partial match
  for (const mapping of mappings) {
    const mappingName = mapping.loungeName.toLowerCase().trim();
    if (mappingName.includes(normalizedName) || normalizedName.includes(mappingName)) {
      return mapping.loungeCode;
    }
  }

  return null;
}

/**
 * Get date range from visit data
 */
export function getDateRange(data: LoungeVisitData[]): { min: Date; max: Date } | null {
  if (data.length === 0) return null;

  let min = data[0].visitHour;
  let max = data[0].visitHour;

  for (const record of data) {
    if (record.visitHour < min) min = record.visitHour;
    if (record.visitHour > max) max = record.visitHour;
  }

  return { min, max };
}

/**
 * Calculate color and bar height based on visit count
 * Color scale: Blue (empty/low) -> Green (medium) -> Red (high)
 */
export function getVisitColorIntensity(
  visits: number,
  maxVisits: number
): { color: string; barHeight: number } {
  if (visits === 0) {
    return { color: "#3b82f6", barHeight: 0 }; // Blue for empty
  }

  const ratio = visits / maxVisits;

  // Color gradient: Blue (low) -> Green (medium) -> Red (high)
  let color: string;
  if (ratio < 0.33) {
    // Blue for low volume (0-33%)
    color = "#3b82f6";
  } else if (ratio < 0.66) {
    // Green for medium volume (33-66%)
    color = "#10b981";
  } else {
    // Red for high volume (66-100%)
    color = "#ef4444";
  }

  // Bar height as percentage (0-100)
  const barHeight = ratio * 100;

  return { color, barHeight };
}

