import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'foodsafe',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function initDb() {
  console.log('🔄 Initializing PostgreSQL database tables and seed data...');

  // Create tables
  await pool.query(`
    -- Categories
    CREATE TABLE IF NOT EXISTS business_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Businesses / Clients
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      business_name VARCHAR(255) NOT NULL,
      business_category_id INTEGER REFERENCES business_categories(id) ON DELETE RESTRICT,
      business_type VARCHAR(100),
      contact_person VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      status VARCHAR(50) DEFAULT 'COMPLIANT',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL, -- CONSULTANT, CLIENT, MANAGER, STAFF
      client_id INTEGER REFERENCES businesses(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Requirement Templates (Consultant-configured)
    CREATE TABLE IF NOT EXISTS requirement_templates (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES business_categories(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      requirement_type VARCHAR(100) DEFAULT 'STATUTORY',
      frequency VARCHAR(100) DEFAULT 'ANNUAL',
      evidence_type VARCHAR(100) DEFAULT 'PDF / Image',
      reminder_schedule JSONB DEFAULT '[30, 15, 7]'::jsonb,
      default_duration_days INTEGER DEFAULT 365,
      default_priority VARCHAR(50) DEFAULT 'HIGH',
      active BOOLEAN DEFAULT true,
      consultant_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Client Requirements (Assigned instances)
    CREATE TABLE IF NOT EXISTS client_requirements (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      requirement_template_id INTEGER REFERENCES requirement_templates(id) ON DELETE RESTRICT,
      custom_name VARCHAR(255),
      assigned_date DATE DEFAULT CURRENT_DATE,
      due_date DATE NOT NULL,
      expiry_date DATE,
      status VARCHAR(50) DEFAULT 'Upcoming', 
      priority VARCHAR(50) DEFAULT 'HIGH',
      assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      consultant_notes TEXT,
      last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Evidence Documents
    CREATE TABLE IF NOT EXISTS evidence_documents (
      id SERIAL PRIMARY KEY,
      client_requirement_id INTEGER NOT NULL REFERENCES client_requirements(id) ON DELETE CASCADE,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(100),
      file_size INTEGER,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      review_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
      reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewer_notes TEXT,
      reviewed_at TIMESTAMP WITH TIME ZONE
    );

    -- Regulatory Updates
    CREATE TABLE IF NOT EXISTS regulatory_updates (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      description TEXT,
      source VARCHAR(255),
      source_url VARCHAR(500),
      published_date DATE DEFAULT CURRENT_DATE,
      effective_date DATE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED
      consultant_notes TEXT,
      simulated_reach INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Regulatory Category Targets
    CREATE TABLE IF NOT EXISTS regulatory_targets (
      id SERIAL PRIMARY KEY,
      regulatory_update_id INTEGER NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,
      business_category_id INTEGER NOT NULL REFERENCES business_categories(id) ON DELETE CASCADE
    );

    -- Regulatory Client Targets
    CREATE TABLE IF NOT EXISTS regulatory_client_targets (
      id SERIAL PRIMARY KEY,
      regulatory_update_id INTEGER NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- Regulatory Acknowledgements
    CREATE TABLE IF NOT EXISTS regulatory_acknowledgements (
      id SERIAL PRIMARY KEY,
      regulatory_update_id INTEGER NOT NULL REFERENCES regulatory_updates(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'PENDING' -- PENDING, ACKNOWLEDGED
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- CRITICAL, ACTION_REQUIRED, UPCOMING, REGULATORY, INFORMATIONAL
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'MEDIUM',
      related_entity_type VARCHAR(100),
      related_entity_id VARCHAR(100),
      read_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100),
      metadata JSONB,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log('✅ Tables checked/created successfully.');

  // Check if seeded
  const userCheck = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCheck.rows[0].count, 10) === 0) {
    console.log('🌱 Seeding database with realistic demonstration dataset...');
    await seedDatabase();
  } else {
    console.log(`ℹ️ Database already contains ${userCheck.rows[0].count} users. Ready.`);
  }
}

export async function logAudit(userId: number | null, action: string, entityType: string, entityId: string | null, metadata: any = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, timestamp) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, action, entityType, entityId, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

async function seedDatabase() {
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('FoodSafe2026!', salt);

  // 1. Categories
  const categories = [
    { name: 'Pickle Manufacturer', desc: 'Commercial pickle and condiment preservation units' },
    { name: 'Papad Manufacturer', desc: 'Traditional and automated papad rolling & drying facilities' },
    { name: 'Masala Manufacturer', desc: 'Spice grinding, blending and packaging establishments' },
    { name: 'Snack Manufacturer', desc: 'Namkeen, extruded snacks and savoury food processors' },
    { name: 'Bakery', desc: 'Artisanal & commercial bakeries, pastries and confectionery' },
    { name: 'Restaurant', desc: 'Dine-in full service and multi-cuisine restaurant facilities' },
    { name: 'Cafe', desc: 'Quick service beverage, snacks and specialty coffee outlets' },
    { name: 'Cloud Kitchen', desc: 'Delivery-only commercial culinary prep hubs' },
  ];

  const catMap = new Map<string, number>();
  for (const cat of categories) {
    const res = await pool.query(
      `INSERT INTO business_categories (name, description, active) VALUES ($1, $2, true) RETURNING id`,
      [cat.name, cat.desc]
    );
    catMap.set(cat.name, res.rows[0].id);
  }

  // 2. Businesses (18 realistic enterprises)
  const businesses = [
    { name: 'Shree Foods', cat: 'Pickle Manufacturer', type: 'Manufacturing Unit', person: 'Rajesh Sharma', phone: '+91 98201 12345', email: 'rajesh@shreefoods.demo', city: 'Pune', state: 'Maharashtra', status: 'ATTENTION_REQUIRED' },
    { name: 'Maa Papad Udyog', cat: 'Papad Manufacturer', type: 'Manufacturing Unit', person: 'Sunita Patel', phone: '+91 98202 23456', email: 'sunita@maapapad.demo', city: 'Ahmedabad', state: 'Gujarat', status: 'COMPLIANT' },
    { name: 'Annapurna Foods', cat: 'Masala Manufacturer', type: 'Processing Plant', person: 'Vikas Deshmukh', phone: '+91 98203 34567', email: 'vikas@annapurnafoods.demo', city: 'Nagpur', state: 'Maharashtra', status: 'CRITICAL' },
    { name: 'FreshBite Snacks', cat: 'Snack Manufacturer', type: 'Production Unit', person: 'Amit Kulkarni', phone: '+91 98204 45678', email: 'amit@freshbite.demo', city: 'Nashik', state: 'Maharashtra', status: 'COMPLIANT' },
    { name: 'Green Leaf Restaurant', cat: 'Restaurant', type: 'Dine-in FSSAI State', person: 'Pooja Nair', phone: '+91 98205 56789', email: 'pooja@greenleaf.demo', city: 'Mumbai', state: 'Maharashtra', status: 'ATTENTION_REQUIRED' },
    { name: 'Maharashtra Bakery', cat: 'Bakery', type: 'Bakery & Confectionery', person: 'Ganesh Joshi', phone: '+91 98206 67890', email: 'ganesh@maharashtrabakery.demo', city: 'Satara', state: 'Maharashtra', status: 'COMPLIANT' },
    { name: 'Royal Caterers', cat: 'Cloud Kitchen', type: 'Central Kitchen', person: 'Farhan Shaikh', phone: '+91 98207 78901', email: 'farhan@royalcaterers.demo', city: 'Thane', state: 'Maharashtra', status: 'ATTENTION_REQUIRED' },
    { name: 'Saffron Spice Works', cat: 'Masala Manufacturer', type: 'Export Milling', person: 'Dinesh Mehta', phone: '+91 98208 89012', email: 'dinesh@saffronspices.demo', city: 'Surat', state: 'Gujarat', status: 'COMPLIANT' },
    { name: 'Bawarchi Cloud Kitchens', cat: 'Cloud Kitchen', type: 'Commercial Kitchen', person: 'Kavita Rao', phone: '+91 98209 90123', email: 'kavita@bawarchikitchens.demo', city: 'Bengaluru', state: 'Karnataka', status: 'COMPLIANT' },
    { name: 'Urban Bean Cafe', cat: 'Cafe', type: 'Specialty Cafe', person: 'Rohan Sen', phone: '+91 98210 01234', email: 'rohan@urbanbean.demo', city: 'Pune', state: 'Maharashtra', status: 'COMPLIANT' },
    { name: 'Golden Crust Breads', cat: 'Bakery', type: 'Industrial Bakery', person: 'Anand Iyer', phone: '+91 98211 12345', email: 'anand@goldencrust.demo', city: 'Navi Mumbai', state: 'Maharashtra', status: 'ATTENTION_REQUIRED' },
    { name: 'Swad Namkeen Bhandar', cat: 'Snack Manufacturer', type: 'Frying & Packing', person: 'Mahesh Gupta', phone: '+91 98212 23456', email: 'mahesh@swadnamkeen.demo', city: 'Indore', state: 'Madhya Pradesh', status: 'COMPLIANT' },
    { name: 'Vyanjan Dosa Hub', cat: 'Restaurant', type: 'Quick Service', person: 'Lakshmi Narayan', phone: '+91 98213 34567', email: 'lakshmi@vyanjan.demo', city: 'Hyderabad', state: 'Telangana', status: 'COMPLIANT' },
    { name: 'Classic Papad Kendra', cat: 'Papad Manufacturer', type: 'Manual Processing', person: 'Suresh Patil', phone: '+91 98214 45678', email: 'suresh@classicpapad.demo', city: 'Kolhapur', state: 'Maharashtra', status: 'COMPLIANT' },
    { name: 'Spice Route Exotics', cat: 'Masala Manufacturer', type: 'Dry Blending', person: 'Manoj Verma', phone: '+91 98215 56789', email: 'manoj@spiceroute.demo', city: 'Kochi', state: 'Kerala', status: 'COMPLIANT' },
    { name: 'Nani Achar & Preserves', cat: 'Pickle Manufacturer', type: 'Artisanal Unit', person: 'Sharda Devi', phone: '+91 98216 67890', email: 'sharda@naniachar.demo', city: 'Jaipur', state: 'Rajasthan', status: 'COMPLIANT' },
    { name: 'Daily Brew Cafe Co.', cat: 'Cafe', type: 'Boutique Coffee', person: 'Neha Kapoor', phone: '+91 98217 78901', email: 'neha@dailybrew.demo', city: 'Mumbai', state: 'Maharashtra', status: 'COMPLIANT' },
    { name: 'Tandoor Express', cat: 'Cloud Kitchen', type: 'Delivery Outlet', person: 'Imran Qureshi', phone: '+91 98218 89012', email: 'imran@tandoorexpress.demo', city: 'Delhi', state: 'Delhi NCR', status: 'CRITICAL' }
  ];

  const bizMap = new Map<string, number>();
  for (const b of businesses) {
    const catId = catMap.get(b.cat);
    const res = await pool.query(
      `INSERT INTO businesses (business_name, business_category_id, business_type, contact_person, phone, email, address, city, state, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [b.name, catId, b.type, b.person, b.phone, b.email, 'Industrial Estate, Phase II', b.city, b.state, b.status]
    );
    bizMap.set(b.name, res.rows[0].id);
  }

  const shreeFoodsId = bizMap.get('Shree Foods');

  // 3. Demo Users
  // Consultant
  const consultantUser = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, client_id, status)
     VALUES ($1, $2, $3, $4, $5, NULL, 'ACTIVE') RETURNING id`,
    ['Pravin Kale (Lead Consultant)', 'consultant@demo.foodsafe', '+91 98000 00001', defaultPasswordHash, 'CONSULTANT']
  );
  const consultantId = consultantUser.rows[0].id;

  // Client (Shree Foods Owner)
  const clientUser = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, client_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING id`,
    ['Rajesh Sharma', 'client@demo.foodsafe', '+91 98201 12345', defaultPasswordHash, 'CLIENT', shreeFoodsId]
  );
  const clientId = clientUser.rows[0].id;

  // Manager (Shree Foods QA Manager)
  const managerUser = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, client_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING id`,
    ['Santosh Kamble (QA Head)', 'manager@demo.foodsafe', '+91 98201 99999', defaultPasswordHash, 'MANAGER', shreeFoodsId]
  );
  const managerId = managerUser.rows[0].id;

  // Staff (Shree Foods)
  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, client_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
    ['Deepak Patil (Technician)', 'staff@demo.foodsafe', '+91 98201 88888', defaultPasswordHash, 'STAFF', shreeFoodsId]
  );

  // 4. Requirement Templates
  const templates = [
    { cat: 'Pickle Manufacturer', name: 'FSSAI Licence Renewal', desc: 'Valid Food Safety and Standards Authority of India manufacturing licence', type: 'STATUTORY', freq: 'ANNUAL', ev: 'PDF / Licence Certificate', rem: [30, 15, 7], dur: 365, prio: 'CRITICAL' },
    { cat: 'Pickle Manufacturer', name: 'Water Potability Testing (IS 10500)', desc: 'Quarterly chemical and microbiological water analysis test report from NABL lab', type: 'SAFETY', freq: 'QUARTERLY', ev: 'NABL Lab Report (PDF)', rem: [15, 7], dur: 90, prio: 'HIGH' },
    { cat: 'Pickle Manufacturer', name: 'Pest Control Audit & Treatment', desc: 'Monthly pest prevention, rodent baiting and insect monitoring certification', type: 'HYGIENE', freq: 'MONTHLY', ev: 'Service Receipt / Certificate', rem: [7, 3], dur: 30, prio: 'MEDIUM' },
    { cat: 'Pickle Manufacturer', name: 'FoSTaC Supervisor Certification', desc: 'Mandatory trained Food Safety Supervisor certificate under FSSAI mandate', type: 'STATUTORY', freq: 'BIENNIAL', ev: 'FoSTaC Certificate', rem: [30, 15], dur: 730, prio: 'MEDIUM' },
    { cat: 'Pickle Manufacturer', name: 'Periodic Finished Product Lab Testing', desc: 'Annual microbial and chemical parameter verification test', type: 'QUALITY', freq: 'SEMI_ANNUAL', ev: 'Lab Certificate', rem: [30, 15], dur: 180, prio: 'HIGH' },
    { cat: 'Papad Manufacturer', name: 'FSSAI Licence Renewal', desc: 'Valid FSSAI manufacturing licence', type: 'STATUTORY', freq: 'ANNUAL', ev: 'PDF / Licence', rem: [30, 15, 7], dur: 365, prio: 'CRITICAL' },
    { cat: 'Papad Manufacturer', name: 'Worker Medical Fitness & Deworming', desc: 'Form IX Medical examination certificates for all food handlers', type: 'STATUTORY', freq: 'ANNUAL', ev: 'Doctor Certificate / Form IX', rem: [30, 15], dur: 365, prio: 'HIGH' },
    { cat: 'Masala Manufacturer', name: 'Pesticide Residue & Heavy Metal Test', desc: 'Mandatory testing for aflatoxins and heavy metals in raw spices', type: 'STATUTORY', freq: 'QUARTERLY', ev: 'NABL Certificate', rem: [15, 7], dur: 90, prio: 'CRITICAL' },
    { cat: 'Restaurant', name: 'FSSAI State Licence', desc: 'Active food establishment licence display', type: 'STATUTORY', freq: 'ANNUAL', ev: 'Licence Copy', rem: [30, 15], dur: 365, prio: 'CRITICAL' },
    { cat: 'Restaurant', name: 'Quarterly Pest Management', desc: 'Contract pest management report for dining and kitchen spaces', type: 'HYGIENE', freq: 'QUARTERLY', ev: 'Vendor Certificate', rem: [15, 7], dur: 90, prio: 'HIGH' }
  ];

  const templateMap = new Map<string, number>();
  for (const t of templates) {
    const catId = catMap.get(t.cat);
    const res = await pool.query(
      `INSERT INTO requirement_templates (category_id, name, description, requirement_type, frequency, evidence_type, reminder_schedule, default_duration_days, default_priority, active, consultant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10) RETURNING id`,
      [catId, t.name, t.desc, t.type, t.freq, t.ev, JSON.stringify(t.rem), t.dur, t.prio, consultantId]
    );
    templateMap.set(`${t.cat}_${t.name}`, res.rows[0].id);
  }

  // 5. Client Requirements for Shree Foods (Matches Specification Step 1-3)
  // Date calculations relative to today
  const today = new Date();
  const datePlusDays = (d: number) => {
    const copy = new Date(today);
    copy.setDate(copy.getDate() + d);
    return copy.toISOString().split('T')[0];
  };

  const fssaiTempId = templateMap.get('Pickle Manufacturer_FSSAI Licence Renewal');
  const waterTempId = templateMap.get('Pickle Manufacturer_Water Potability Testing (IS 10500)');
  const pestTempId = templateMap.get('Pickle Manufacturer_Pest Control Audit & Treatment');
  const fostacTempId = templateMap.get('Pickle Manufacturer_FoSTaC Supervisor Certification');
  const labTempId = templateMap.get('Pickle Manufacturer_Periodic Finished Product Lab Testing');

  // Shree Foods requirement 1: FSSAI Licence (Due soon, expires in 12 days)
  const req1 = await pool.query(
    `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, assigned_user_id, consultant_notes, last_activity_at)
     VALUES ($1, $2, 'FSSAI Central / State Licence', $3, $4, $5, 'Due Soon', 'CRITICAL', $6, 'Licence renewal application must be submitted along with Form B at least 30 days prior to expiry.', NOW() - INTERVAL '2 days') RETURNING id`,
    [shreeFoodsId, fssaiTempId, datePlusDays(-350), datePlusDays(12), datePlusDays(12), clientId]
  );
  const shreeFssaiReqId = req1.rows[0].id;

  // Existing document for FSSAI: current licence.pdf
  await pool.query(
    `INSERT INTO evidence_documents (client_requirement_id, file_url, file_name, file_type, file_size, uploaded_by, uploaded_at, review_status, reviewer_id, reviewer_notes)
     VALUES ($1, '/uploads/sample_fssai_licence.pdf', 'Current licence.pdf', 'application/pdf', 142850, $2, NOW() - INTERVAL '340 days', 'APPROVED', $3, 'Verified 2025 licence certificate.')`,
    [shreeFssaiReqId, clientId, consultantId]
  );

  // Shree Foods requirement 2: Water Test (Due in 8 days, evidence not submitted)
  await pool.query(
    `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, assigned_user_id, consultant_notes, last_activity_at)
     VALUES ($1, $2, 'Water Potability Testing (IS 10500)', $3, $4, $5, 'Due', 'HIGH', $6, 'Quarterly water testing from NABL accredited laboratory for pH, TDS, Coliform and E. coli.', NOW() - INTERVAL '5 days')`,
    [shreeFoodsId, waterTempId, datePlusDays(-82), datePlusDays(8), datePlusDays(8), managerId]
  );

  // Shree Foods requirement 3: Pest Control (Completed/Approved, next due in 72 days)
  const req3 = await pool.query(
    `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, assigned_user_id, consultant_notes, last_activity_at)
     VALUES ($1, $2, 'Pest Control Audit & Treatment', $3, $4, $5, 'Approved', 'MEDIUM', $6, 'Monthly pest control treatment carried out and verified.', NOW() - INTERVAL '18 days') RETURNING id`,
    [shreeFoodsId, pestTempId, datePlusDays(-18), datePlusDays(72), datePlusDays(72), clientId]
  );
  await pool.query(
    `INSERT INTO evidence_documents (client_requirement_id, file_url, file_name, file_type, file_size, uploaded_by, uploaded_at, review_status, reviewer_id, reviewer_notes, reviewed_at)
     VALUES ($1, '/uploads/pest_control_q1.pdf', 'Pest_Control_Certificate_Q1.pdf', 'application/pdf', 98200, $2, NOW() - INTERVAL '18 days', 'APPROVED', $3, 'Approved. Treatment bait map provided.', NOW() - INTERVAL '17 days')`,
    [req3.rows[0].id, clientId, consultantId]
  );

  // Shree Foods requirement 4: FoSTaC (Upcoming, due in 22 days)
  await pool.query(
    `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, assigned_user_id, consultant_notes)
     VALUES ($1, $2, 'FoSTaC Supervisor Certificate', $3, $4, $5, 'Upcoming', 'MEDIUM', $6, 'Ensure at least 1 certified food safety supervisor per shift.')`,
    [shreeFoodsId, fostacTempId, datePlusDays(-10), datePlusDays(22), datePlusDays(22), managerId]
  );

  // Requirements for Maa Papad Udyog (Compliant)
  const maaId = bizMap.get('Maa Papad Udyog');
  const papadLicenceId = templateMap.get('Papad Manufacturer_FSSAI Licence Renewal');
  if (maaId && papadLicenceId) {
    const maaReq = await pool.query(
      `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, consultant_notes)
       VALUES ($1, $2, 'FSSAI Licence', $3, $4, $5, 'Approved', 'CRITICAL', 'All requirements current.') RETURNING id`,
      [maaId, papadLicenceId, datePlusDays(-200), datePlusDays(165), datePlusDays(165)]
    );
    await pool.query(
      `INSERT INTO evidence_documents (client_requirement_id, file_url, file_name, file_type, file_size, uploaded_by, uploaded_at, review_status, reviewer_id, reviewer_notes, reviewed_at)
       VALUES ($1, '/uploads/maa_papad_licence.pdf', 'Maa_Papad_FSSAI_2026.pdf', 'application/pdf', 120000, $2, NOW() - INTERVAL '30 days', 'APPROVED', $3, 'Valid licence.', NOW() - INTERVAL '29 days')`,
      [maaReq.rows[0].id, consultantId, consultantId]
    );
  }

  // Requirements for Annapurna Foods (Critical - Overdue Lab Testing)
  const annapurnaId = bizMap.get('Annapurna Foods');
  const masalaTestId = templateMap.get('Masala Manufacturer_Pesticide Residue & Heavy Metal Test');
  if (annapurnaId && masalaTestId) {
    await pool.query(
      `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, consultant_notes)
       VALUES ($1, $2, 'Lab Testing (Heavy Metals & Residue)', $3, $4, $5, 'Overdue', 'CRITICAL', 'URGENT: Quarterly test report is 14 days overdue. Immediate testing required.')`,
      [annapurnaId, masalaTestId, datePlusDays(-104), datePlusDays(-14), datePlusDays(-14)]
    );
  }

  // Requirements for Green Leaf Restaurant (Attention Required - Pest Control due in 8 days)
  const greenLeafId = bizMap.get('Green Leaf Restaurant');
  const restPestId = templateMap.get('Restaurant_Quarterly Pest Management');
  if (greenLeafId && restPestId) {
    await pool.query(
      `INSERT INTO client_requirements (client_id, requirement_template_id, custom_name, assigned_date, due_date, expiry_date, status, priority, consultant_notes)
       VALUES ($1, $2, 'Pest Control Service', $3, $4, $5, 'Due Soon', 'HIGH', 'Service due in 8 days before monsoon audit.')`,
      [greenLeafId, restPestId, datePlusDays(-82), datePlusDays(8), datePlusDays(8)]
    );
  }

  // 6. Regulatory Updates (Pre-seeded Demo Regulatory Update)
  const pickleCatId = catMap.get('Pickle Manufacturer');
  const papadCatId = catMap.get('Papad Manufacturer');
  const masalaCatId = catMap.get('Masala Manufacturer');

  const updateRes = await pool.query(
    `INSERT INTO regulatory_updates (title, summary, description, source, source_url, published_date, effective_date, created_by, status, consultant_notes, simulated_reach)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PUBLISHED', $9, 693) RETURNING id`,
    [
      'DEMO REGULATORY UPDATE: Revised Limits for Sodium Benzoate & Sorbic Acid in Preserved Foods',
      'FSSAI notification regarding maximum permissible limits of class II preservatives in pickled and dehydrated vegetable matrices.',
      'Under the Food Safety and Standards (Food Products Standards and Food Additives) amendment regulations, manufacturers of pickles and preserved food items are required to review dosing rates for chemical preservatives. Batch analysis reports must demonstrate adherence to limits below 250 ppm. All production logs must document additive weighment verification.',
      'FSSAI Technical Notification Gaz. 2026/04',
      'https://fssai.gov.in/advisories',
      datePlusDays(-3),
      datePlusDays(30),
      consultantId,
      'Mandatory acknowledgement required from all pickle and papad preservation units.'
    ]
  );
  const regUpdateId = updateRes.rows[0].id;

  // Add targets
  if (pickleCatId) {
    await pool.query(`INSERT INTO regulatory_targets (regulatory_update_id, business_category_id) VALUES ($1, $2)`, [regUpdateId, pickleCatId]);
  }
  if (papadCatId) {
    await pool.query(`INSERT INTO regulatory_targets (regulatory_update_id, business_category_id) VALUES ($1, $2)`, [regUpdateId, papadCatId]);
  }
  if (masalaCatId) {
    await pool.query(`INSERT INTO regulatory_targets (regulatory_update_id, business_category_id) VALUES ($1, $2)`, [regUpdateId, masalaCatId]);
  }

  // Add acknowledgement record for Shree Foods (pending by default so client can acknowledge in demo step 10)
  await pool.query(
    `INSERT INTO regulatory_acknowledgements (regulatory_update_id, client_id, user_id, status)
     VALUES ($1, $2, NULL, 'PENDING')`,
    [regUpdateId, shreeFoodsId]
  );

  // 7. Seeded Notifications
  await pool.query(
    `INSERT INTO notifications (recipient_user_id, type, title, message, priority, related_entity_type, related_entity_id, created_at)
     VALUES 
     ($1, 'CRITICAL', 'FSSAI Licence Expiry Alert', 'Shree Foods licence expires in 12 days. Renewal document must be uploaded promptly.', 'CRITICAL', 'CLIENT_REQUIREMENT', $2, NOW() - INTERVAL '1 day'),
     ($3, 'CRITICAL', 'FSSAI Licence Expiry Notice', 'Your FSSAI Licence expires in 12 days. Please upload the renewal application receipt or new licence.', 'CRITICAL', 'CLIENT_REQUIREMENT', $2, NOW() - INTERVAL '1 day'),
     ($4, 'ACTION_REQUIRED', 'FSSAI Licence Renewal Task', 'Please upload the renewed FSSAI Licence or application acknowledgement.', 'HIGH', 'CLIENT_REQUIREMENT', $2, NOW() - INTERVAL '1 day'),
     ($3, 'REGULATORY', 'New Regulatory Update Published', 'DEMO REGULATORY UPDATE: Revised Limits for Sodium Benzoate & Sorbic Acid. Please review and acknowledge.', 'HIGH', 'REGULATORY_UPDATE', $5, NOW() - INTERVAL '3 hours')`,
    [consultantId, shreeFssaiReqId, clientId, managerId, regUpdateId]
  );

  // 8. Seeded Audit Logs
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, timestamp)
     VALUES 
     ($1, 'SYSTEM_INITIALIZED', 'SYSTEM', '1', '{"version": "1.0.0", "seeded_businesses": 18}'::jsonb, NOW() - INTERVAL '3 days'),
     ($1, 'CREATED_BUSINESS', 'BUSINESS', $2, '{"name": "Shree Foods", "category": "Pickle Manufacturer"}'::jsonb, NOW() - INTERVAL '3 days'),
     ($1, 'ASSIGNED_REQUIREMENT', 'CLIENT_REQUIREMENT', $3, '{"name": "FSSAI Licence", "due_date": "12 days"}'::jsonb, NOW() - INTERVAL '2 days'),
     ($1, 'PUBLISHED_REGULATORY_UPDATE', 'REGULATORY_UPDATE', $4, '{"title": "DEMO REGULATORY UPDATE: Revised Limits", "categories": ["Pickle Manufacturer", "Papad Manufacturer"]}'::jsonb, NOW() - INTERVAL '3 hours')`,
    [consultantId, shreeFoodsId, shreeFssaiReqId, regUpdateId]
  );

  // Create a placeholder sample PDF file for demo evidence
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const samplePdfPath = path.join(uploadsDir, 'sample_fssai_licence.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    fs.writeFileSync(samplePdfPath, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Contents 4 0 R/Resources<<>>>>endobj\n4 0 obj<</Length 82>>stream\nBT /F1 18 Tf 50 800 Td (FOODSAFE DEMO: FSSAI Licence Document) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n345\n%%EOF`);
  }

  console.log('✅ Seeding completed successfully!');
}
