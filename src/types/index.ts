export interface Profile {
  id: string;
  full_name: string | null;
  country: string | null;
  specialty: string | null;
  gpa: number | null;
  ielts_score: number | null;
  financial_situation: string | null;
  desired_countries: string[] | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type UniversityCategory = 'Safety' | 'Target' | 'Reach';

export interface SavedUniversity {
  id: string;
  user_id: string;
  university_id: string;
  university_name: string;
  country: string;
  category: UniversityCategory;
  match_score: number;
  tuition_fee: number;
  saved_at: string;
}

export interface ChecklistItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  is_completed: boolean;
  category: string;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  nameRu: string;
  country: string;
  countryRu: string;
  city: string;
  cityRu: string;
  qsRank: number;
  minGpa: number;
  minIelts: number;
  tuitionUsd: number;
  specialties: string[];
  specialtiesRu: string[];
  lat: number;
  lng: number;
  founded: number;
  students: number;
  history: string;
  requirements: string[];
  grants: string[];
  gallery: string[];
}

export interface UniversityMatch extends University {
  category: UniversityCategory;
  matchScore: number;
}
