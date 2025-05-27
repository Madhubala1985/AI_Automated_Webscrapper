
export interface CompanyLead {
  id: string;
  companyName: string;
  externalWebsite?: string;
  profileUrl?: string;
  contactPerson?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  industry?: string;
  location?: string;
  enrichedSource: boolean;
  extractedFrom: string;
  lastUpdated: Date;
  emailContent?: string;
  status: 'extracted' | 'enriched' | 'personalized' | 'exported';
}

export interface EnrichmentConfig {
  hunterApiKey?: string;
  clearbitApiKey?: string;
  apolloApiKey?: string;
  enableSpacyNER: boolean;
  enableEmailGeneration: boolean;
}

export interface ScrapingSession {
  id: string;
  url: string;
  startTime: Date;
  endTime?: Date;
  totalLeads: number;
  successfulExtractions: number;
  failedExtractions: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  leads: CompanyLead[];
}

export interface EmailTemplate {
  subject: string;
  baseContent: string;
  personalizationFields: string[];
}
