// src/types.ts

// Define ItemType as a CONST OBJECT for runtime values
// This allows us to use Object.values() on it in components
export const ItemType = {
  Items: 'Items',
  OneHanded: 'One Handed',
  TwoHanded: 'Two Handed',
  Rapier: 'Rapier',
  Dagger: 'Dagger',
  LowerHeadwear: 'Lower Headwear',
  UpperHeadwear: 'Upper Headwear',
  Armor: 'Armor',
  Shields: 'Shields',
  Overlay: 'Overlay',
} as const; // 'as const' makes it a "readonly" type, ensuring literal string values

// Now, derive the ItemType TYPE from the ItemType CONST OBJECT
// This creates a union type of all its string values for strict type checking
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

// Ingredient for blacksmithing
export interface Ingredient {
  name: string;
  quantity: number;
}

// Discriminant union for different acquisition types
export type AcquisitionType =
  | 'blacksmithing'
  | 'mob-drop' // Changed back to hyphenated for consistency with previous use
  | 'merchant'
  | 'mining'
  | 'quest-rewards';

// Base Acquisition interface (used for the discriminant property)
interface BaseAcquisition {
  type: AcquisitionType;
}

export interface BlacksmithingAcquisition extends BaseAcquisition {
  type: 'blacksmithing';
  ingredients: Ingredient[];
  smithingSkillRequired?: number; // Optional
}

export interface MobDropAcquisition extends BaseAcquisition {
  type: 'mob-drop';
  mobSources: {
    // Changed 'sources' to 'mobSources' for clarity
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion';
    floor: number;
  }[];
}

export interface MerchantAcquisition extends BaseAcquisition {
  type: 'merchant';
  itemWorthCol?: number; // Changed from itemWorth to itemWorthCol for clarity with currency
  merchantFloor?: number;
}

export interface MiningAcquisition extends BaseAcquisition {
  type: 'mining';
  mineableFloor?: number;
}

export interface QuestRewardAcquisition extends BaseAcquisition {
  type: 'quest-rewards';
  questName: string;
  questFloor?: number;
}

// Union type for all possible acquisition methods
export type Acquisition =
  | BlacksmithingAcquisition
  | MobDropAcquisition
  | MerchantAcquisition
  | MiningAcquisition
  | QuestRewardAcquisition;

// Main Recipe interface
export interface Recipe {
  itemName: string;
  itemType: ItemType; // Using the ItemType derived type
  acquisition: Acquisition;
}
