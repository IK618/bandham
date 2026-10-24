export type Gender = "MALE" | "FEMALE" | "OTHER";
export type UserRole = "MEMBER" | "MODERATOR" | "ADMIN";
export type MaritalStatus = "NEVER_MARRIED" | "DIVORCED" | "WIDOWED" | "AWAITING_DIVORCE";
export type Diet = "VEGETARIAN" | "NON_VEGETARIAN" | "EGGETARIAN" | "VEGAN" | "JAIN";
export type ManglikStatus = "YES" | "NO" | "DONT_KNOW" | "ANGSHIK";
export type InterestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";

export interface ProfileCard {
  id: string;
  user_id: string;
  profile_id_display: string;
  first_name: string;
  last_name?: string;
  last_initial?: string;
  gender: Gender;
  age: number;
  height_cm: number;
  marital_status: MaritalStatus;
  religion: string;
  community: string;
  mother_tongue: string;
  highest_education: string;
  occupation: string;
  annual_income_bracket: string;
  residence_city: string;
  residence_state: string;
  diet: Diet;
  manglik: ManglikStatus;
  bio_narrative: string;
  thumbnail_url?: string;
  is_photo_blurred: boolean;
  compatibility_score?: number;
}

export interface ProfileDetail extends ProfileCard {
  created_by: string;
  date_of_birth: string;
  gotra?: string;
  education_field: string;
  college_name?: string;
  employment_sector: string;
  citizenship: string;
  family_type: string;
  family_values: string;
  smoking: string;
  drinking: string;
  profile_completeness_pct: number;
  photo_urls: string[];
  has_contact_revealed: boolean;
}

export interface PartnerPreference {
  id: string;
  user_id: string;
  min_age: number;
  max_age: number;
  min_height_cm: number;
  max_height_cm: number;
  acceptable_marital_statuses: string[];
  acceptable_religions: string[];
  acceptable_communities: string[];
  acceptable_mother_tongues: string[];
  acceptable_countries: string[];
  acceptable_cities: string[];
  min_education_level?: string;
  acceptable_employment_sectors: string[];
  min_income_bracket?: string;
  acceptable_diets: string[];
  manglik_preference: string;
}

export interface InterestItem {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: InterestStatus;
  greeting_message?: string;
  created_at: string;
  sender_profile?: ProfileCard;
  recipient_profile?: ProfileCard;
}

export interface ShortlistItem {
  id: string;
  user_id: string;
  shortlisted_user_id: string;
  notes?: string;
  created_at: string;
  shortlisted_profile?: ProfileCard;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: "SENT" | "DELIVERED" | "READ";
  created_at: string;
}

export interface ConversationItem {
  id: string;
  partner_profile?: ProfileCard;
  last_message?: ChatMessage;
  unread_count: number;
  updated_at: string;
}

export interface SubscriptionItem {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  starts_at: string;
  expires_at: string;
  contact_credits_remaining: number;
}

export interface PlanItem {
  id: string;
  name: string;
  duration_months: number;
  price_cents: number;
  currency: string;
  contact_credits_quota: number;
  can_initiate_chat: boolean;
  can_view_hidden_photos: boolean;
  priority_boost: number;
  is_active: boolean;
}
