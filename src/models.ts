export interface TimelineItem {
  id: string;
  text: string;
  order: number;
}

export interface Campaign {
  id: string;
  title: string;
  summary: string;
  tone: string;
  timelineItems: TimelineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  title: string;
  text: string;
  order: number;
  linkedNpcIds: string[];
}

export interface Session {
  id: string;
  title: string;
  objective: string;
  notes: string;
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

export interface AppData {
  campaign: Campaign;
  sessions: Session[];
  npcs: Npc[];
}
