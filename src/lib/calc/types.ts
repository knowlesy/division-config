export type GearSlot = 'mask' | 'backpack' | 'chest' | 'gloves' | 'holster' | 'kneepads';
export type WeaponSlot = 'primary' | 'secondary' | 'sidearm';

export type CoreType = 'Weapon Damage' | 'Armor' | 'Skill Tier';

export type MultiplierGroupName =
  | 'Weapon Damage'
  | 'Total Weapon Damage'
  | 'Critical Hit Chance'
  | 'Critical Hit Damage'
  | 'Headshot Damage'
  | 'Skill Damage'
  | 'Total Skill Damage'
  | 'Skill Repair'
  | 'Status Effects'
  | 'Rate of Fire'
  | 'Amplifier'
  | 'Utility';

export type Beneficiary = 'self' | 'ally' | 'enemy-debuff';

export interface BonusTerm {
  group: MultiplierGroupName;
  value: number; // e.g. 0.15 for +15%
  source: string;
  condition?: string;
  isIndependentAmp?: boolean; // For amplifiers which are always their own term
  confidence?: string; // '[PDF]' | '[UBI]' | '[SHEET]' | '[?]'
  beneficiary?: Beneficiary; // 'self' | 'ally' | 'enemy-debuff'
}

export interface AttributeRoll {
  attribute: string;
  value: number;
  unit: string;
  isRecalibrated?: boolean;
  isLocked?: boolean;
}

export interface GearPieceInstance {
  slot: GearSlot;
  kind: 'brand' | 'gear-set' | 'named' | 'exotic' | 'improvised';
  name: string;
  brandOrSetId: string;
  core: {
    type: CoreType;
    value: number;
    isRecalibrated?: boolean;
  };
  minors: AttributeRoll[];
  modSlot?: AttributeRoll | null;
  talent?: string | null;
  isTalentRecalibrated?: boolean;
}

export interface WeaponInstance {
  slot: WeaponSlot;
  name: string;
  category: string; // 'Assault Rifle', 'LMG', etc.
  baseDamage: number;
  rpm: number;
  magSize: number;
  reloadTime: number;
  innateHsd: number; // e.g. 0.55
  coreAttribute: { type: string; value: number };
  secondaryCoreAttribute: { type: string; value: number };
  minorAttribute?: AttributeRoll | null;
  talent?: string | null;
  mods?: {
    optics?: AttributeRoll | null;
    magazine?: AttributeRoll | null;
    muzzle?: AttributeRoll | null;
    underbarrel?: AttributeRoll | null;
  };
  isExotic?: boolean;
}

export interface WatchStats {
  weaponDamage?: number; // 0..0.10
  headshotDamage?: number; // 0..0.20
  critChance?: number; // 0..0.10
  critDamage?: number; // 0..0.20
  armor?: number; // 0..0.10
  health?: number; // 0..0.10
  hazardProtection?: number; // 0..0.10
  explosiveResistance?: number; // 0..0.10
  skillDamage?: number; // 0..0.10
  skillRepair?: number; // 0..0.10
  skillHaste?: number; // 0..0.10
  skillDuration?: number; // 0..0.20
  reloadSpeed?: number; // 0..0.10
  accuracy?: number; // 0..0.10
  ammo?: number; // 0..0.20
  stability?: number; // 0..0.10
}

export interface CombatContext {
  isSolo: boolean;
  distanceMeters: number;
  enemyTargetTier?: 'red' | 'veteran' | 'elite' | 'named' | 'lowest';
  isEnemyPulsed?: boolean;
  isEnemyStatusAffected?: boolean;
  isEnemyBurning?: boolean;
  isEnemyOutOfCover?: boolean;
  isEnemySuppressed?: boolean;
  isPlayerInCover?: boolean;
  isPlayerFullArmor?: boolean;
  playerBonusArmorPct?: number;
  strikerStacks?: number;
  heartstopperStacks?: number;
  throttleControlStacks?: number;
  huntersFuryKillStacks?: number;
  activeStatusEffectBonus?: number;
}

export interface ActiveSetBonus {
  setName: string;
  piecesCount: number;
  effectivePiecesCount: number; // Accounting for NinjaBike
  tierUnlocked: number; // 2, 3, or 4
  bonuses: Array<{ attribute: string; value: number; unit: string; raw: string }>;
  talent?: string | null;
}

export interface MultiplierGroupBreakdown {
  weaponDamageSum: number;
  totalWeaponDamageSum: number;
  critChance: number;
  critDamage: number;
  effectiveCritFactor: number;
  headshotDamage: number;
  skillDamageSum: number;
  totalSkillDamageSum: number;
  skillRepairSum: number;
  statusEffectsSum: number;
  hazardProtectionSum: number;
  rateOfFireMultiplier: number;
  magazineSizeMultiplier: number;
  reloadSpeedMultiplier: number;
  threatMultiplier: number;
  amplifiers: Array<{ source: string; factor: number; condition?: string; beneficiary?: Beneficiary }>;
  totalAmplifierMultiplier: number;
  allyDamageBonusSum: number;
  allyMitigationBonusSum: number;
  enemyDebuffMultiplier: number;
}

export interface ComputedLoadoutStats {
  effectiveBulletDamage: number;
  effectiveCritHitDamage: number;
  effectiveHeadshotDamage: number;
  effectiveHeadshotCritDamage: number;
  expectedDamagePerShot: number;
  burstDps: number;
  sustainedDps: number;
  pestilencePlagueTickDamage?: number;
  totalArmor: number;
  totalHealth: number;
  effectiveHealth: number;
  threatMultiplier: number;
  hazardProtection: number;
  skillHasteSum: number;
  skillTier: number;
  activeSetBonuses: ActiveSetBonus[];
  activeBrandBonuses: ActiveSetBonus[];
  groupBreakdown: MultiplierGroupBreakdown;
  warnings: string[];
  confidenceFlags: string[];
  itemisationValid: boolean;
  itemisationErrors: string[];
}
