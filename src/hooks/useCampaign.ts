import { useAppData } from "../state/AppDataContext";

export function useCampaign() {
  const {
    campaigns,
    currentCampaign,
    selectCampaign,
    createCampaign,
    deleteCampaign,
  } = useAppData();

  return {
    campaigns,
    currentCampaign,
    selectCampaign,
    createCampaign,
    deleteCampaign,
  };
}

