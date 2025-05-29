export interface Stage {
  name: string;
  date: string;
  notes?: string;
}

export interface Application {
  id: string;
  companyName: string;
  channel: string;
  jobTitle: string;
  applicationDate: string;
  stages: Stage[];
}

export type ApplicationData = Application[];

export const PREDEFINED_STAGES = [
  "Applied",
  "Rejected",
  "Ghosted",
  "1st round",
  "2nd round",
  "3rd round",
  "4th round",
  "5th round",
  "6th round",
  "Withdrew",
  "Offer",
  "Accepted",
  "Declined",
];

export const CHANNELS = [
  "LinkedIn",
  "Company Website",
  "Refferal",
  "Glassdoor",
]
