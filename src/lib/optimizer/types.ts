import { GearSlot, GearPieceInstance, WeaponInstance, ComputedLoadoutStats } from '../calc/types';

export type OptimizationObjective =
  | 'max_sustained_dps'
  | 'max_burst_dps'
  | 'max_bullet_hit'
  | 'max_plague_damage'
  | 'max_status_effects'
  | 'max_skill_damage'
  | 'max_armor_dps';

export interface OptimizerConstraints {
  minArmor?: number; // e.g. 1000000
  minSkillTier?: number; // 0..6
  requiredGearSetId?: string; // e.g. 'tipping-scales', 'striker-s-battlegear', 'eclipse-protocol'
  requiredBrandId?: string; // e.g. 'ceska-vyroba-s-r-o', 'grupo-sombra-s-a-s'
  requiredExoticId?: string; // e.g. 'coyotes-mask', 'overdogs', 'vile'
  targetChc?: number; // default 0.60
}

export interface CandidateBuild {
  id: string;
  name: string;
  gear: Record<GearSlot, GearPieceInstance>;
  weapon: WeaponInstance;
  secondaryWeapon?: WeaponInstance;
  sidearm?: WeaponInstance;
  score: number;
  stats: ComputedLoadoutStats;
  tradeoffAnalysis: string[];
}
