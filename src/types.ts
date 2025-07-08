// src/types.ts

// Define fixed types for ItemType for strictness
export type ItemType =
  | 'Items'
  | 'One Handed'
  | 'Two Handed'
  | 'Rapier'
  | 'Dagger'
  | 'Lower Headwear'
  | 'Upper Headwear'
  | 'Armor'
  | 'Shields'
  | 'Overlay';

// Ingredient for blacksmithing
export interface Ingredient {
  name: string;
  quantity: number;
}

// Discriminant union for different acquisition types
export type AcquisitionType =
  | 'blacksmithing'
  | 'mob_drop'
  | 'merchant'
  | 'mining'
  | 'quest_rewards'; // ✅ Added new acquisition type

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
  type: 'mob_drop';
  sources: {
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion'; // ✅ Added mobType with fixed categories
    floor: number;
  }[];
  // dropType removed based on discussion
}

export interface MerchantAcquisition extends BaseAcquisition {
  type: 'merchant';
  itemWorth?: number; // Cost in "Col"
  merchantFloor?: number; // ✅ Added merchantFloor, will be "F" + number in display
}

export interface MiningAcquisition extends BaseAcquisition {
  type: 'mining';
  mineableFloor?: number; // Will be "F" + number in display
}

// ✅ New interface for Quest Reward Acquisition
export interface QuestRewardAcquisition extends BaseAcquisition {
  type: 'quest_rewards';
  questName: string; // Unique quest name
  questFloor?: number; // Optional, will be "F" + number in display
}

// Union type for all possible acquisition methods
export type Acquisition =
  | BlacksmithingAcquisition
  | MobDropAcquisition
  | MerchantAcquisition
  | MiningAcquisition
  | QuestRewardAcquisition; // ✅ Included new acquisition type

// Main Recipe interface
export interface Recipe {
  itemName: string;
  itemType: ItemType; // Using the ItemType union
  acquisition: Acquisition;
}
