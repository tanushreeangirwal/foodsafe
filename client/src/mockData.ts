import { Business, BusinessCategory, AuditLog, User, UserRole } from './types';

export const MOCK_DEMO_USERS: Record<UserRole, User> = {
  CONSULTANT: {
    id: 1,
    name: 'Pravin Kale (Lead Consultant)',
    email: 'consultant@demo.foodsafe',
    role: 'CONSULTANT',
    client_id: null,
    business_name: undefined
  },
  CLIENT: {
    id: 2,
    name: 'Rajesh Sharma',
    email: 'client@demo.foodsafe',
    role: 'CLIENT',
    client_id: 1,
    business_name: 'Shree Foods'
  },
  MANAGER: {
    id: 3,
    name: 'Santosh Kamble (QA Head)',
    email: 'manager@demo.foodsafe',
    role: 'MANAGER',
    client_id: 1,
    business_name: 'Shree Foods'
  },
  STAFF: {
    id: 4,
    name: 'Deepak Patil (Technician)',
    email: 'staff@demo.foodsafe',
    role: 'STAFF',
    client_id: 1,
    business_name: 'Shree Foods'
  }
};

export const MOCK_CATEGORIES: BusinessCategory[] = [
  { id: 1, name: 'Pickle Manufacturer', description: 'Commercial pickle & condiment preservation units', active: true, business_count: 240, template_count: 5 },
  { id: 2, name: 'Papad Manufacturer', description: 'Traditional and automated papad rolling & drying facilities', active: true, business_count: 185, template_count: 4 },
  { id: 3, name: 'Masala Manufacturer', description: 'Spice grinding, blending and packaging establishments', active: true, business_count: 310, template_count: 6 },
  { id: 4, name: 'Snack Manufacturer', description: 'Namkeen, extruded snacks and savoury food processors', active: true, business_count: 420, template_count: 5 },
  { id: 5, name: 'Bakery', description: 'Artisanal & commercial bakeries, pastries and confectionery', active: true, business_count: 290, template_count: 4 },
  { id: 6, name: 'Restaurant', description: 'Dine-in full service and multi-cuisine restaurant facilities', active: true, business_count: 350, template_count: 4 },
  { id: 7, name: 'Cafe', description: 'Quick service beverage, snacks and specialty coffee outlets', active: true, business_count: 190, template_count: 3 },
  { id: 8, name: 'Cloud Kitchen', description: 'Delivery-only commercial culinary prep hubs', active: true, business_count: 162, template_count: 4 }
];

export const MOCK_BUSINESSES: Business[] = [
  {
    id: 1,
    business_name: 'Shree Foods',
    business_category_id: 1,
    category_name: 'Pickle Manufacturer',
    business_type: 'Manufacturing Unit',
    contact_person: 'Rajesh Sharma',
    phone: '+91 98201 12345',
    email: 'rajesh@shreefoods.demo',
    address: 'Plot 42, Industrial Estate Phase II',
    city: 'Pune',
    state: 'Maharashtra',
    status: 'ATTENTION_REQUIRED',
    created_at: '2025-01-15T09:00:00Z',
    critical_issue: {
      requirement_name: 'Water Potability Testing (IS 10500)',
      priority: 'HIGH',
      status: 'Pending',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    }
  },
  {
    id: 2,
    business_name: 'Maa Papad Udyog',
    business_category_id: 2,
    category_name: 'Papad Manufacturer',
    business_type: 'Manufacturing Unit',
    contact_person: 'Sunita Patel',
    phone: '+91 98202 23456',
    email: 'sunita@maapapad.demo',
    address: 'GIDC Industrial Area',
    city: 'Ahmedabad',
    state: 'Gujarat',
    status: 'COMPLIANT',
    created_at: '2025-02-10T10:00:00Z'
  },
  {
    id: 3,
    business_name: 'Annapurna Foods',
    business_category_id: 3,
    category_name: 'Masala Manufacturer',
    business_type: 'Processing Plant',
    contact_person: 'Vikas Deshmukh',
    phone: '+91 98203 34567',
    email: 'vikas@annapurnafoods.demo',
    address: 'MIDC Hingna',
    city: 'Nagpur',
    state: 'Maharashtra',
    status: 'CRITICAL',
    created_at: '2025-01-20T11:00:00Z',
    critical_issue: {
      requirement_name: 'Pesticide Residue & Heavy Metal Test',
      priority: 'CRITICAL',
      status: 'Overdue',
      due_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      expiry_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
    }
  },
  {
    id: 4,
    business_name: 'FreshBite Snacks',
    business_category_id: 4,
    category_name: 'Snack Manufacturer',
    business_type: 'Production Unit',
    contact_person: 'Amit Kulkarni',
    phone: '+91 98204 45678',
    email: 'amit@freshbite.demo',
    address: 'Ambad MIDC',
    city: 'Nashik',
    state: 'Maharashtra',
    status: 'COMPLIANT',
    created_at: '2025-03-01T08:30:00Z'
  },
  {
    id: 5,
    business_name: 'Green Leaf Restaurant',
    business_category_id: 6,
    category_name: 'Restaurant',
    business_type: 'Dine-in FSSAI State',
    contact_person: 'Pooja Nair',
    phone: '+91 98205 56789',
    email: 'pooja@greenleaf.demo',
    address: 'Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'ATTENTION_REQUIRED',
    created_at: '2025-02-18T14:00:00Z'
  },
  {
    id: 6,
    business_name: 'Maharashtra Bakery',
    business_category_id: 5,
    category_name: 'Bakery',
    business_type: 'Bakery & Confectionery',
    contact_person: 'Ganesh Joshi',
    phone: '+91 98206 67890',
    email: 'ganesh@maharashtrabakery.demo',
    address: 'Powai Naka',
    city: 'Satara',
    state: 'Maharashtra',
    status: 'COMPLIANT',
    created_at: '2025-01-05T09:15:00Z'
  },
  {
    id: 7,
    business_name: 'Royal Caterers',
    business_category_id: 8,
    category_name: 'Cloud Kitchen',
    business_type: 'Central Kitchen',
    contact_person: 'Farhan Shaikh',
    phone: '+91 98207 78901',
    email: 'farhan@royalcaterers.demo',
    address: 'Wagle Estate',
    city: 'Thane',
    state: 'Maharashtra',
    status: 'ATTENTION_REQUIRED',
    created_at: '2025-02-22T12:00:00Z'
  },
  {
    id: 8,
    business_name: 'Saffron Spice Works',
    business_category_id: 3,
    category_name: 'Masala Manufacturer',
    business_type: 'Export Milling',
    contact_person: 'Dinesh Mehta',
    phone: '+91 98208 89012',
    email: 'dinesh@saffronspices.demo',
    address: 'Sachin GIDC',
    city: 'Surat',
    state: 'Gujarat',
    status: 'COMPLIANT',
    created_at: '2025-03-05T10:45:00Z'
  },
  {
    id: 9,
    business_name: 'Tandoor Express',
    business_category_id: 8,
    category_name: 'Cloud Kitchen',
    business_type: 'Delivery Outlet',
    contact_person: 'Imran Qureshi',
    phone: '+91 98218 89012',
    email: 'imran@tandoorexpress.demo',
    address: 'Connaught Place',
    city: 'Delhi',
    state: 'Delhi NCR',
    status: 'CRITICAL',
    created_at: '2025-01-25T16:20:00Z',
    critical_issue: {
      requirement_name: 'Quarterly Pest Management',
      priority: 'CRITICAL',
      status: 'Overdue',
      due_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      expiry_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    }
  }
];

export const MOCK_STATS = {
  portfolio: {
    totalBusinesses: 2147,
    compliant: 1642,
    attentionRequired: 382,
    critical: 123
  },
  immediateAttention: {
    expiredRequirements: 8,
    expiringWithin30Days: 24,
    overdueRequirements: 17,
    awaitingReview: 12
  },
  seededTotal: 18
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Pravin Kale (Lead Consultant)',
    user_email: 'consultant@demo.foodsafe',
    user_role: 'CONSULTANT',
    action: 'BROADCAST_PUBLISH',
    entity_type: 'REGULATORY',
    entity_id: 'REG-2026-04',
    metadata: { title: 'FSSAI Mandate: Updated Water Potability Standard IS 10500:2026' },
    timestamp: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Rajesh Sharma',
    user_email: 'client@demo.foodsafe',
    user_role: 'CLIENT',
    action: 'EVIDENCE_UPLOAD',
    entity_type: 'EVIDENCE',
    entity_id: 'EV-8821',
    metadata: { filename: 'ShreeFoods_WaterTest_Q1.pdf', requirement: 'Water Potability Testing' },
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Santosh Kamble',
    user_email: 'manager@demo.foodsafe',
    user_role: 'MANAGER',
    action: 'CHECKLIST_SUBMIT',
    entity_type: 'TASK',
    entity_id: 'TSK-941',
    metadata: { shift: 'Morning Floor Sanitization', status: 'Completed' },
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 4,
    user_id: 1,
    user_name: 'Pravin Kale (Lead Consultant)',
    user_email: 'consultant@demo.foodsafe',
    user_role: 'CONSULTANT',
    action: 'AUDIT_APPROVED',
    entity_type: 'REQUIREMENT',
    entity_id: 'REQ-104',
    metadata: { business: 'Maa Papad Udyog', requirement: 'Worker Medical Fitness' },
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

export const MOCK_REQUIREMENTS = [
  {
    id: 101,
    client_id: 1,
    business_name: 'Shree Foods',
    template_id: 1,
    requirement_name: 'Water Potability Testing (IS 10500)',
    requirement_type: 'SAFETY',
    frequency: 'QUARTERLY',
    priority: 'HIGH',
    status: 'Pending',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    evidence_type: 'NABL Lab Report (PDF)',
    evidence_count: 1
  },
  {
    id: 102,
    client_id: 1,
    business_name: 'Shree Foods',
    template_id: 2,
    requirement_name: 'FSSAI Licence Renewal',
    requirement_type: 'STATUTORY',
    frequency: 'ANNUAL',
    priority: 'CRITICAL',
    status: 'Approved',
    due_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    evidence_type: 'Licence Copy',
    evidence_count: 2
  },
  {
    id: 103,
    client_id: 1,
    business_name: 'Shree Foods',
    template_id: 3,
    requirement_name: 'Pest Control Audit & Treatment',
    requirement_type: 'HYGIENE',
    frequency: 'MONTHLY',
    priority: 'MEDIUM',
    status: 'Under Review',
    due_date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    evidence_type: 'Service Certificate',
    evidence_count: 1
  },
  {
    id: 104,
    client_id: 1,
    business_name: 'Shree Foods',
    template_id: 4,
    requirement_name: 'FoSTaC Supervisor Certification',
    requirement_type: 'STATUTORY',
    frequency: 'BIENNIAL',
    priority: 'MEDIUM',
    status: 'Approved',
    due_date: new Date(Date.now() + 340 * 86400000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 340 * 86400000).toISOString().split('T')[0],
    evidence_type: 'FoSTaC Certificate',
    evidence_count: 1
  }
];

export const MOCK_REGULATORY = [
  {
    id: 1,
    title: 'FSSAI Mandate: Updated Heavy Metal & Micro-Contaminant Limits',
    category: 'STATUTORY',
    severity: 'CRITICAL',
    effective_date: '2026-10-01',
    description: 'Enforcement of revised limits for lead, mercury, and cadmium in processed spices and pickled condiments.',
    affected_categories: ['Pickle Manufacturer', 'Masala Manufacturer'],
    broadcast_status: 'PUBLISHED',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 2,
    title: 'IS 10500:2026 Drinking Water Microbial Testing Protocol',
    category: 'SAFETY',
    severity: 'HIGH',
    effective_date: '2026-09-15',
    description: 'Mandatory quarterly coliform and total dissolved solids reporting from NABL accredited laboratories.',
    affected_categories: ['Pickle Manufacturer', 'Bakery', 'Restaurant'],
    broadcast_status: 'PUBLISHED',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString()
  }
];
