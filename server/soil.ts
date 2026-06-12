import { z } from "zod";

// Schema for soil test results
export const soilTestSchema = z.object({
  farmerId: z.string(),
  location: z.string(),
  region: z.enum(["NORTH", "SOUTH", "EAST", "WEST"]),
  collectionDate: z.date(),
  pH: z.number().min(3).max(10),
  nitrogen: z.number().min(0).max(500), // mg/kg
  phosphorus: z.number().min(0).max(200), // mg/kg
  potassium: z.number().min(0).max(500), // mg/kg
  organicMatter: z.number().min(0).max(5), // percentage
  calcium: z.number().min(0).max(5000), // mg/kg
  magnesium: z.number().min(0).max(1000), // mg/kg
  sulfur: z.number().min(0).max(500), // mg/kg
  zinc: z.number().min(0).max(50), // mg/kg
  iron: z.number().min(0).max(500), // mg/kg
  manganese: z.number().min(0).max(500), // mg/kg
  copper: z.number().min(0).max(50), // mg/kg
  boron: z.number().min(0).max(5), // mg/kg
});

export type SoilTestResult = z.infer<typeof soilTestSchema>;

// ICAR standards for regional soil parameters
const REGIONAL_SOIL_STANDARDS: Record<
  string,
  Record<string, { min: number; max: number; optimal: [number, number] }>
> = {
  NORTH: {
    pH: { min: 6.0, max: 8.5, optimal: [6.5, 7.5] },
    nitrogen: { min: 200, max: 450, optimal: [300, 400] },
    phosphorus: { min: 20, max: 150, optimal: [60, 120] },
    potassium: { min: 150, max: 400, optimal: [200, 350] },
    organicMatter: { min: 1.0, max: 3.5, optimal: [2.0, 3.0] },
  },
  SOUTH: {
    pH: { min: 5.5, max: 8.0, optimal: [6.0, 7.0] },
    nitrogen: { min: 150, max: 400, optimal: [250, 350] },
    phosphorus: { min: 15, max: 100, optimal: [40, 80] },
    potassium: { min: 100, max: 300, optimal: [150, 250] },
    organicMatter: { min: 0.8, max: 3.0, optimal: [1.5, 2.5] },
  },
  EAST: {
    pH: { min: 5.8, max: 8.2, optimal: [6.5, 7.5] },
    nitrogen: { min: 180, max: 420, optimal: [280, 380] },
    phosphorus: { min: 18, max: 130, optimal: [50, 100] },
    potassium: { min: 120, max: 350, optimal: [180, 300] },
    organicMatter: { min: 0.9, max: 3.2, optimal: [1.8, 2.8] },
  },
  WEST: {
    pH: { min: 6.0, max: 8.0, optimal: [6.5, 7.5] },
    nitrogen: { min: 190, max: 430, optimal: [290, 390] },
    phosphorus: { min: 20, max: 140, optimal: [55, 110] },
    potassium: { min: 140, max: 380, optimal: [210, 360] },
    organicMatter: { min: 1.0, max: 3.3, optimal: [2.0, 3.0] },
  },
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

interface AuditEntry {
  farmerId: string;
  timestamp: Date;
  action: string;
  details: Record<string, unknown>;
}

export class SoilValidationService {
  private auditLog: AuditEntry[] = [];

  validateSoilTest(
    result: SoilTestResult
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const standards =
      REGIONAL_SOIL_STANDARDS[result.region] || REGIONAL_SOIL_STANDARDS.NORTH;

    // Validate pH
    if (result.pH < 3 || result.pH > 10) {
      errors.push(`Invalid pH value: ${result.pH}. Valid range is 3-10`);
    } else if (
      result.pH < standards.pH.min ||
      result.pH > standards.pH.max
    ) {
      warnings.push(
        `pH ${result.pH} is outside optimal range for ${result.region} region (${standards.pH.min}-${standards.pH.max})`
      );
    }

    // Validate Nitrogen
    if (result.nitrogen < 0 || result.nitrogen > 500) {
      errors.push(
        `Invalid nitrogen value: ${result.nitrogen}. Valid range is 0-500 mg/kg`
      );
    } else if (
      result.nitrogen < standards.nitrogen.min ||
      result.nitrogen > standards.nitrogen.max
    ) {
      warnings.push(
        `Nitrogen ${result.nitrogen} mg/kg is outside optimal range (${standards.nitrogen.min}-${standards.nitrogen.max})`
      );
    }

    // Validate Phosphorus
    if (result.phosphorus < 0 || result.phosphorus > 200) {
      errors.push(
        `Invalid phosphorus value: ${result.phosphorus}. Valid range is 0-200 mg/kg`
      );
    } else if (
      result.phosphorus < standards.phosphorus.min ||
      result.phosphorus > standards.phosphorus.max
    ) {
      warnings.push(
        `Phosphorus ${result.phosphorus} mg/kg is outside optimal range (${standards.phosphorus.min}-${standards.phosphorus.max})`
      );
    }

    // Validate Potassium
    if (result.potassium < 0 || result.potassium > 500) {
      errors.push(
        `Invalid potassium value: ${result.potassium}. Valid range is 0-500 mg/kg`
      );
    } else if (
      result.potassium < standards.potassium.min ||
      result.potassium > standards.potassium.max
    ) {
      warnings.push(
        `Potassium ${result.potassium} mg/kg is outside optimal range (${standards.potassium.min}-${standards.potassium.max})`
      );
    }

    // Validate Organic Matter
    if (result.organicMatter < 0 || result.organicMatter > 5) {
      errors.push(
        `Invalid organic matter value: ${result.organicMatter}%. Valid range is 0-5%`
      );
    } else if (
      result.organicMatter < standards.organicMatter.min ||
      result.organicMatter > standards.organicMatter.max
    ) {
      warnings.push(
        `Organic matter ${result.organicMatter}% is outside optimal range (${standards.organicMatter.min}-${standards.organicMatter.max}%)`
      );
    }

    // Validate micronutrients
    const micronutrients = {
      calcium: { max: 5000, optimal: [1000, 3000] },
      magnesium: { max: 1000, optimal: [150, 400] },
      sulfur: { max: 500, optimal: [100, 300] },
      zinc: { max: 50, optimal: [2, 10] },
      iron: { max: 500, optimal: [4, 20] },
      manganese: { max: 500, optimal: [2, 10] },
      copper: { max: 50, optimal: [0.2, 2] },
      boron: { max: 5, optimal: [0.2, 1.5] },
    };

    for (const [nutrient, limits] of Object.entries(micronutrients)) {
      const value = result[nutrient as keyof SoilTestResult] as number;

      if (value < 0 || value > limits.max) {
        errors.push(
          `Invalid ${nutrient} value: ${value}. Valid range is 0-${limits.max} mg/kg`
        );
      } else if (
        value < limits.optimal[0] ||
        value > limits.optimal[1]
      ) {
        warnings.push(
          `${nutrient} level ${value} is below optimal range (${limits.optimal[0]}-${limits.optimal[1]})`
        );
      }
    }

    // Check collection date (should not be in future)
    if (result.collectionDate > new Date()) {
      errors.push("Soil collection date cannot be in the future");
    }

    // Check if sample collection procedure was followed
    if (!this.isSampleCollectionValid(result)) {
      warnings.push(
        "Soil sample may not have been collected according to standard procedures"
      );
    }

    // Generate recommendations
    if (result.pH < 6.5) {
      recommendations.push("Soil is acidic. Consider applying lime to neutralize");
    } else if (result.pH > 7.5) {
      recommendations.push("Soil is alkaline. Consider sulfur application");
    }

    if (result.nitrogen < standards.nitrogen.optimal[0]) {
      recommendations.push(`Apply nitrogen fertilizer to reach ${standards.nitrogen.optimal[1]} mg/kg`);
    }

    if (result.phosphorus < standards.phosphorus.optimal[0]) {
      recommendations.push(
        `Apply phosphate fertilizer to improve phosphorus levels`
      );
    }

    if (result.organicMatter < standards.organicMatter.optimal[0]) {
      recommendations.push("Increase organic matter by adding compost or manure");
    }

    // Log the validation
    this.logAudit(result.farmerId, "SOIL_TEST_VALIDATED", {
      region: result.region,
      pH: result.pH,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  private isSampleCollectionValid(result: SoilTestResult): boolean {
    // Check if sample was collected recently (within 30 days)
    const collectionAge = Date.now() - result.collectionDate.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (collectionAge > thirtyDays) {
      return false;
    }

    // Check if all required nutrients were tested
    const requiredNutrients = [
      "pH",
      "nitrogen",
      "phosphorus",
      "potassium",
      "organicMatter",
    ];

    for (const nutrient of requiredNutrients) {
      if (
        result[nutrient as keyof SoilTestResult] === null ||
        result[nutrient as keyof SoilTestResult] === undefined
      ) {
        return false;
      }
    }

    return true;
  }

  private logAudit(
    farmerId: string,
    action: string,
    details: Record<string, unknown>
  ): void {
    this.auditLog.push({
      farmerId,
      timestamp: new Date(),
      action,
      details,
    });
  }

  getAuditLog(farmerId?: string): AuditEntry[] {
    if (!farmerId) {
      return this.auditLog;
    }

    return this.auditLog.filter((entry) => entry.farmerId === farmerId);
  }
}

export const soilValidationService = new SoilValidationService();
