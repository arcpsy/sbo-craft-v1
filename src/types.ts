// src/types.ts

/**
 * This file defines all core TypeScript interfaces and types used throughout the application.
 * It serves as the single source of truth for data structures, ensuring type safety,
 * consistency, and clarity across components, stores, and utility functions.
 */

/**
 * Defines a constant object for various item types.
 * Using `as const` ensures that the values are treated as literal types,
 * which is crucial for deriving a strict union type (`ItemTypeType`) and for
 * runtime usage (e.g., populating dropdowns with `Object.values(ItemType)`).
 */
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
} as const;

/**
 * Derives a union type from the `ItemType` constant object.
 * This type (`'Items' | 'One Handed' | ...`) ensures that any variable
 * or property typed as `ItemTypeType` can only hold one of these predefined string values,
 * providing strong compile-time type checking for item categories.
 */
export type ItemTypeType = (typeof ItemType)[keyof typeof ItemType];

/**
 * Represents a single ingredient required for a crafting recipe.
 * Used specifically within blacksmithing recipes.
 */
export interface Ingredient {
  name: string;
  quantity: number;
}

/**
 * A union type defining all possible acquisition methods for an item.
 * This type is used as a "discriminant property" in the `Acquisition` union,
 * allowing TypeScript to intelligently narrow down the specific acquisition interface.
 */
export type AcquisitionType =
  | 'blacksmithing'
  | 'mob-drop'
  | 'merchant'
  | 'mining'
  | 'quest-rewards';

/**
 * Base interface for all acquisition types.
 * It includes the `type` property, which acts as the discriminant for the `Acquisition` union.
 */
interface BaseAcquisition {
  type: AcquisitionType;
}

/**
 * Defines the structure for items acquired through blacksmithing.
 * Extends `BaseAcquisition` and includes specific properties like `ingredients`
 * and an optional `smithingSkillRequired`.
 */
export interface BlacksmithingAcquisition extends BaseAcquisition {
  type: 'blacksmithing';
  ingredients: Ingredient[];
  smithingSkillRequired?: number; // Optional skill level required for crafting
}

/**
 * Defines the structure for items acquired as mob drops.
 * Includes an array of `mobSources`, each detailing the mob, its type, and floor.
 */
export interface MobDropAcquisition extends BaseAcquisition {
  type: 'mob-drop';
  mobSources: {
    mobName: string;
    mobType: 'Boss' | 'Miniboss' | 'Minion';
    floor: number;
  }[];
}

/**
 * Defines the structure for items acquired from merchants.
 * Includes optional properties for item worth in "Col" (currency) and merchant floor.
 */
export interface MerchantAcquisition extends BaseAcquisition {
  type: 'merchant';
  itemWorthCol?: number; // Cost of the item in "Col"
  merchantFloor?: number; // Floor where the merchant is located
}

/**
 * Defines the structure for items acquired through mining.
 * Includes an optional property for the mineable floor.
 */
export interface MiningAcquisition extends BaseAcquisition {
  type: 'mining';
  mineableFloor?: number; // Floor where the item can be mined
}

/**
 * Defines the structure for items acquired as quest rewards.
 * Includes the `questName` and an optional `questFloor`.
 */
export interface QuestRewardAcquisition extends BaseAcquisition {
  type: 'quest-rewards';
  questName: string;
  questFloor?: number; // Floor where the quest is given or completed
}

/**
 * A union type representing all possible ways an item can be acquired.
 * This is a "discriminant union" where the `type` property determines
 * which specific acquisition interface (e.g., `BlacksmithingAcquisition`)
 * is being used, allowing for type-safe access to its unique properties.
 */
export type Acquisition =
  | BlacksmithingAcquisition
  | MobDropAcquisition
  | MerchantAcquisition
  | MiningAcquisition
  | QuestRewardAcquisition;

/**
 * The main interface for a crafting recipe.
 * This is the core data structure used throughout the application to represent
 * a single recipe entry. It combines general item information with its specific
 * acquisition details.
 */
export interface Recipe {
  itemName: string; // The name of the item being crafted or acquired
  itemType: ItemTypeType; // The category of the item (e.g., 'Armor', 'One Handed')
  acquisition: Acquisition; // Details on how the item is acquired, using the discriminant union
}

/**
 * Represents a material that the user already possesses.
 */
export interface OwnedMaterial {
  itemName: string;
  quantity: number;
}