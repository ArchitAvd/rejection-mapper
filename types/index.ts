export interface Stage {
  name: string;
  date: string;
  notes?: string;
}

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  applicationDate: string;
  stages: Stage[];
}

export type ApplicationData = Application[];

export const PREDEFINED_STAGES = [
  "Applied",
  "Resume Reviewed",
  "Technical Interview",
  "HR Interview",
  "Offer Received",
  "Offer Accepted",
  "Offer Declined",
  "Rejected",
  "Ghosted",
  "Withdrew",
];
