export type UserRole = 'CONSULTANT' | 'CLIENT' | 'MANAGER' | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  client_id: number | null;
  business_name?: string;
}

export interface BusinessCategory {
  id: number;
  name: string;
  description: string;
  active: boolean;
  business_count?: number;
  template_count?: number;
}

export interface Business {
  id: number;
  business_name: string;
  business_category_id: number;
  category_name?: string;
  category_description?: string;
  business_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  status: 'COMPLIANT' | 'ATTENTION_REQUIRED' | 'CRITICAL';
  created_at: string;
  critical_issue?: {
    requirement_name: string;
    priority: string;
    status: string;
    due_date: string;
    expiry_date: string;
  } | null;
  next_due_date?: string | null;
  last_activity?: string | null;
}

export interface RequirementTemplate {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  requirement_type: string;
  frequency: string;
  evidence_type: string;
  reminder_schedule: number[];
  default_duration_days: number;
  default_priority: string;
  active: boolean;
  active_assignments?: number;
}

export interface EvidenceDocument {
  id: number;
  client_requirement_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  uploader_name?: string;
  uploaded_at: string;
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: number;
  reviewer_name?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  business_name?: string;
  category_name?: string;
  requirement_name?: string;
  due_date?: string;
  priority?: string;
}

export interface ClientRequirement {
  id: number;
  client_id: number;
  business_name?: string;
  city?: string;
  category_name?: string;
  requirement_template_id: number;
  template_name?: string;
  template_description?: string;
  custom_name?: string;
  assigned_date: string;
  due_date: string;
  expiry_date: string;
  status: 'Upcoming' | 'Due Soon' | 'Due' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Overdue' | 'Expired';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigned_user_id?: number;
  consultant_notes?: string;
  last_activity_at?: string;
  created_at?: string;
  requirement_type?: string;
  frequency?: string;
  evidence_type?: string;
  reminder_schedule?: number[];
  documents?: EvidenceDocument[];
}

export interface RegulatoryUpdate {
  id: number;
  title: string;
  summary: string;
  description: string;
  source: string;
  source_url: string;
  published_date: string;
  effective_date: string;
  created_by: number;
  creator_name?: string;
  status: string;
  consultant_notes?: string;
  simulated_reach?: number;
  targeted_categories?: { id: number; name: string }[];
  actual_acknowledged_count?: number;
  actual_target_count?: number;
  acknowledgement_status?: 'PENDING' | 'ACKNOWLEDGED';
  acknowledged_at?: string;
}

export interface AppNotification {
  id: number;
  recipient_user_id: number;
  type: 'CRITICAL' | 'ACTION_REQUIRED' | 'UPCOMING' | 'REGULATORY' | 'INFORMATIONAL';
  title: string;
  message: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  related_entity_type?: string;
  related_entity_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: any;
  timestamp: string;
}
