export interface Person {
  names: {
    first_name: string;
    full_name: string;
    gup_person_id: number;
    last_name: string;
    primary: boolean;
  }[];
  primaryName: string;
  gupPersonIds: number[];
  id: number;
  label: string;
  value: number;
} 