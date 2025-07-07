// src/types.ts

export interface Ingredient {
  name: string;
  quantity: number;
}

export interface MobDropSource {
  mobName: string;
  floor: number;
}

// Define specific acquisition types
export type AcquisitionType =
  | 'blacksmithing'
  | 'mob_drop'
  | 'merchant'
  | 'mining';

export interface BlacksmithingAcquisition {
  type: 'blacksmithing';
  ingredients: Ingredient[];
  smithingSkillRequired?: number; // Optional
}

export interface MobDropAcquisition {
  type: 'mob_drop';
  sources: MobDropSource[];
  dropType?: 'Material' | 'Equipment' | 'Key Item'; // Optional, refine as needed
}

export interface MerchantAcquisition {
  type: 'merchant';
  itemWorth?: number; // Optional, e.g., in-game currency
  merchantLocation?: string; // Optional
}

export interface MiningAcquisition {
  type: 'mining';
  mineableFloor?: number; // Optional, e.g., floor where it can be mined
}

// Union type for all possible acquisition methods
export type Acquisition =
  | BlacksmithingAcquisition
  | MobDropAcquisition
  | MerchantAcquisition
  | MiningAcquisition;

// Main Recipe interface
export interface Recipe {
  itemName: string;
  itemType: string; // e.g., "Weapon", "Material", "Ore", "Food"
  acquisition: Acquisition;
  // Add any other top-level recipe properties here
}

// Interface for a node in the crafting tree visualization
export interface CraftingTreeNode {
  itemName: string;
  itemType: string;
  quantityRequired: number; // Quantity needed by its parent to craft the parent item
  totalQuantity: number; // Total quantity needed for the root item of the tree
  acquisition: Acquisition;
  children: CraftingTreeNode[]; // Ingredients that make up this item
  // Properties for D3.js visualization layout
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  childrenVisible: boolean; // For expand/collapse functionality
  parentId?: string | null; // For drawing links between parent and child nodes
}
