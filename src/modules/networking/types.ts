/**
 * Career Networking Domain Types
 * Single-user career relationship management for Badri Vishal Pandey
 */

export type LeadCategory =
  | "ENGINEER_MAINTAINER"
  | "ALUMNI"
  | "RECRUITER_TALENT"
  | "FOUNDER_HIRING_MGR"
  | "EMBEDDED_HARDWARE";

export type RelationshipState =
  | "IDENTIFIED"
  | "DRAFTED"
  | "CONTACTED"
  | "CONNECTED"
  | "UNRESPONSIVE"
  | "DO_NOT_CONTACT";

export interface SharedTechnicalReason {
  userSkillOrProject: string;
  recipientWork: string;
  commonDomain: string;
}

export interface ConnectionNote {
  channel: "LINKEDIN_NOTE" | "EMAIL_NOTE";
  text: string;
  characterCount: number;
  isWithinLimit: boolean; // <= 300 chars for LinkedIn connection request
}

export interface NetworkLeadItem {
  id: string;
  fullName: string;
  roleTitle: string;
  company: string;
  category: LeadCategory;
  profileUrl: string;
  provenanceUrl: string;
  relevanceEvidence: string;
  domainFocus: string;
  sharedTechnicalReason: SharedTechnicalReason;
  connectionNote: ConnectionNote;
  connectionState: RelationshipState;
  notes?: string;
  followUpDate?: string;
  lastVerifiedAt?: string;
  lastContactedAt?: string;
  isDoNotContact: boolean;
  score: number; // 0 to 100 ranking score
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNetworkLeadInput {
  fullName: string;
  roleTitle: string;
  company: string;
  category: LeadCategory;
  profileUrl: string;
  provenanceUrl: string;
  domainFocus: string;
  relevanceEvidence?: string;
  customNote?: string;
  notes?: string;
  followUpDate?: string;
  score?: number;
}

export interface UpdateNetworkLeadInput {
  id: string;
  fullName?: string;
  roleTitle?: string;
  company?: string;
  category?: LeadCategory;
  profileUrl?: string;
  provenanceUrl?: string;
  domainFocus?: string;
  relevanceEvidence?: string;
  connectionState?: RelationshipState;
  connectionNoteText?: string;
  notes?: string;
  followUpDate?: string;
  isDoNotContact?: boolean;
}

export interface AntiSpamStatus {
  dailyDraftCount: number;
  dailyCap: number; // 5 drafts per day
  isDailyCapReached: boolean;
  recentContactsCount: number; // Contacts within 60 days
  doNotContactCount: number;
}

export interface NetworkFilterOptions {
  search?: string;
  category?: string;
  domain?: string;
  state?: string;
}
