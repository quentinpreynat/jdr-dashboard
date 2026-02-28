export interface Campaign {
  id: string;
  title: string;
  summary: string;
  tone: string;
  places: Place[];
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: string;
  name: string;
  region?: string;
  description?: string;
}

export interface LiveNote {
  id: string;
  text: string;
  createdAt: number;
  createdFromSceneId?: string;
}

export type SceneChoiceTargetType = "place" | "npc";

export type ChoiceIntent =
  | "explore"
  | "search"
  | "move"
  | "talk"
  | "attack"
  | "other";

export interface SceneChoice {
  id: string;
  label: string;
  targetType: SceneChoiceTargetType;
  targetId: string;
  intent?: ChoiceIntent;
}

export interface Scene {
  id: string;
  title: string;
  text: string;
  linkedNpcIds: string[];
  placeId?: string;
  liveNotes?: LiveNote[];
  choices?: SceneChoice[];
}

export interface Session {
  id: string;
  title: string;
  objective: string;
  notes: string;
  openingText?: string;
  scenes: Scene[];
  inTimeline: boolean;
  timelineOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type NpcAttitude = "friendly" | "neutral" | "wary" | "hostile";

export interface Npc {
  id: string;
  name: string;
  role: string;
  locationText: string;
  description: string;
  notes: string;
  attitude: NpcAttitude;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  for: number;
  dex: number;
  int: number;
  con: number;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  role: string;
  hpCurrent: number;
  hpMax: number;
  stats: PlayerStats;
  conditions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  campaign: Campaign;
  sessions: Session[];
  npcs: Npc[];
  pcs: PlayerCharacter[];
}
