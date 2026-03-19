export interface AppSettings {
  improvisationEnabled: boolean;
  expertMode: boolean;
}

export const defaultSettings: AppSettings = {
  improvisationEnabled: true,
  expertMode: false,
};
