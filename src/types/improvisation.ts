export interface ImprovisationResult {
  npc: string;
  location: string;
  event: string;
  rumor: string;
  complication: string;
}

export interface ImprovisationContext {
  campaignTitle?: string;
  sessionTitle?: string;
  sessionObjective?: string;
  sceneTitle?: string;
  sceneText?: string;
  placeName?: string;
  linkedNpcNames?: string[];
}
