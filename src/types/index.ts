export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  color: string;
  glowColor: string;
  accentBg: string;
  role: string;
  independent: boolean;
}

export type OutreachStatusType =
  | 'not_contacted'
  | 'drafting'
  | 'emailed'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'interview'
  | 'applied'
  | 'accepted'
  | 'rejected';

export interface OutreachRecord {
  id?: string;
  userId: string;
  status: OutreachStatusType;
  dateEmailed?: string;
  responseDate?: string;
  followUpDate?: string;
  notes?: string;
  emailSubject?: string;
  lastUpdated: string;
}

export interface Professor {
  id: string;
  departmentId: string;
  name: string;
  title: string;
  email: string;
  websiteUrl?: string;
  scholarUrl?: string;
  researchAreas: string[];
  acceptingStudents: 'yes' | 'no' | 'unknown' | 'maybe';
  notes?: string;
  visibility: 'public' | 'private';
  ownerId?: string;
  ownerName?: string;
  onMyList?: boolean;
  myOutreach?: OutreachRecord | null;
  createdAt: string;
}

export interface Department {
  id: string;
  universityId: string;
  name: string;
  degreeLevel: 'PhD' | 'MS' | 'PhD & MS' | 'BS/MS';
  websiteUrl?: string;
  deadlines?: {
    fall?: string;
    spring?: string;
  };
  requirements?: {
    gre?: string;
    toeflOrIelts?: string;
    feeWaiverAvailable?: boolean;
    feeWaiverNotes?: string;
  };
  professors: Professor[];
  createdAt: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking?: number;
  portalUrl?: string;
  websiteUrl?: string;
  notes?: string;
  departments: Department[];
  createdAt: string;
}

export interface MastersCourse {
  id: string;
  universityName: string;
  departmentName: string;
  ieltsReq: string;
  lastDate: string;
  applicationLink: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId?: string;
  ownerName?: string;
  isMine?: boolean;
  onMyList?: boolean;
  myStatus?: CourseApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export type CourseApplicationStatus =
  | 'interested'
  | 'preparing'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface Scholarship {
  id: string;
  title: string;
  organization: string;
  degreeLevel: string;
  amount: string;
  deadline: string;
  country: string;
  applicationLink: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId?: string;
  ownerName?: string;
  isMine?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const COURSE_APPLICATION_STATUSES: CourseApplicationStatus[] = [
  'interested',
  'preparing',
  'applied',
  'interview',
  'offer',
  'rejected',
];

export type ActivityAction =
  | 'added_university'
  | 'added_department'
  | 'added_professor'
  | 'updated_outreach'
  | 'deleted_entity'
  | 'toggled_list'
  | 'masters_course'
  | 'scholarship';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  action: ActivityAction;
  description: string;
  metadata?: {
    universityName?: string;
    departmentName?: string;
    professorName?: string;
    newStatus?: OutreachStatusType;
  };
}

export interface AppData {
  universities: University[];
  mastersCourses: MastersCourse[];
  scholarships: Scholarship[];
  me: User;
  activityLogs: ActivityLog[];
  version: string;
}

export interface FilterOptions {
  searchQuery: string;
  country: string;
  statusFilter: OutreachStatusType | 'all';
  needsFollowUp: boolean;
  degreeLevel: string;
  visibility: 'all' | 'public' | 'private';
}

/* -------------------------------------------------------------
 * University homepage discovery (scraping)
 * ----------------------------------------------------------- */
export type DegreeLevel = 'bachelor' | 'masters' | 'phd';

export const DEGREE_LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
];

export interface ScrapedProgram {
  id: string;
  name: string;
  universityName: string;
  degreeLevel: DegreeLevel;
  url: string;
  deadline: string;
  applicationOpen: boolean | null;
  summary: string;
  sourceUrl: string;
}

export interface ScrapeResponse {
  success: boolean;
  error?: string;
  universityName?: string;
  homepage?: string;
  degreeLevel?: DegreeLevel;
  scannedPages?: number;
  results?: ScrapedProgram[];
}

/* -------------------------------------------------------------
 * Legacy dataset shape (data/tracker-data.json and backups)
 * ----------------------------------------------------------- */
export interface LegacyFriend {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  glowColor: string;
  accentBg: string;
  independent?: boolean;
}

export interface LegacyOutreachRecord {
  friendId: string;
  status: OutreachStatusType;
  dateEmailed?: string;
  responseDate?: string;
  followUpDate?: string;
  notes?: string;
  emailSubject?: string;
  lastUpdated: string;
}

export interface LegacyProfessor extends Omit<Professor, 'myOutreach' | 'visibility' | 'ownerId' | 'ownerName'> {
  outreach?: Record<string, LegacyOutreachRecord>;
  visibility?: 'public' | 'private';
  ownerUsername?: string;
}

export interface LegacyDepartment extends Omit<Department, 'professors'> {
  professors: LegacyProfessor[];
}

export interface LegacyUniversity extends Omit<University, 'departments'> {
  departments: LegacyDepartment[];
}

export interface LegacyActivityLog extends Omit<ActivityLog, 'userId'> {
  friendId: string;
}

export interface LegacyDataset {
  version: string;
  friends: Record<string, LegacyFriend>;
  universities: LegacyUniversity[];
  activityLogs: LegacyActivityLog[];
}
