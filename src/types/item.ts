export interface Item {
  id: string;
  name: string;
  description: string;
  linkedNpcIds?: string[];
  linkedPlaceIds?: string[];
  notes?: string;
}

