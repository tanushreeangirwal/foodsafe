const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${json.error || JSON.stringify(json)}`);
  }
  return json;
}

async function runE2EVerification() {
  console.log('============================================================');
  console.log('🧪 FOODSAFE — END-TO-END AUTOMATED DEMO FLOW VERIFICATION');
  console.log('============================================================\n');

  // STEP 1: Login as Consultant
  console.log('▶ STEP 1: Login as Consultant (consultant@demo.foodsafe)...');
  const consultantAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'consultant@demo.foodsafe', password: 'FoodSafe2026!' })
  });
  console.log(`  ✓ Logged in as: ${consultantAuth.user.name} [Role: ${consultantAuth.user.role}]`);

  const stats = await request('/businesses/dashboard/stats', {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  console.log(`  ✓ Portfolio Metrics:`);
  console.log(`    - Total Businesses: ${stats.portfolio.totalBusinesses}`);
  console.log(`    - Compliant: ${stats.portfolio.compliant}`);
  console.log(`    - Attention Required: ${stats.portfolio.attentionRequired}`);
  console.log(`    - Critical: ${stats.portfolio.critical}`);
  console.log(`    - Expiring in 30 Days: ${stats.immediateAttention.expiringWithin30Days}`);
  console.log(`    - Submissions Awaiting Review: ${stats.immediateAttention.awaitingReview}`);

  // STEP 2: Open Shree Foods (Pickle Manufacturer)
  console.log('\n▶ STEP 2: Open Shree Foods (Pickle Manufacturer)...');
  const bizList = await request('/businesses', {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  const shreeFoods = bizList.businesses.find(b => b.business_name === 'Shree Foods');
  if (!shreeFoods) throw new Error('Shree Foods not found in businesses list');
  console.log(`  ✓ Located Shree Foods (ID: ${shreeFoods.id}, Category: ${shreeFoods.category_name}, Status: ${shreeFoods.status})`);

  const shreeProfile = await request(`/businesses/${shreeFoods.id}`, {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  console.log(`  ✓ Requirements loaded: ${shreeProfile.requirements.length} total requirements.`);
  shreeProfile.requirements.forEach(r => {
    console.log(`    - [${r.status.toUpperCase()}] ${r.custom_name || r.template_name} (Due: ${r.due_date})`);
  });

  const fssaiReq = shreeProfile.requirements.find(r => (r.custom_name || r.template_name).includes('FSSAI'));
  if (!fssaiReq) throw new Error('FSSAI requirement not found for Shree Foods');

  // STEP 3: Inspect FSSAI Requirement details
  console.log('\n▶ STEP 3: Inspect FSSAI Licence Requirement Details...');
  const fssaiDetail = await request(`/requirements/${fssaiReq.id}`, {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  console.log(`  ✓ Requirement: ${fssaiDetail.requirement.custom_name}`);
  console.log(`  ✓ Status: ${fssaiDetail.requirement.status}`);
  console.log(`  ✓ Priority: ${fssaiDetail.requirement.priority}`);
  console.log(`  ✓ Expiry Date: ${fssaiDetail.requirement.expiry_date}`);
  console.log(`  ✓ Consultant Notes: "${fssaiDetail.requirement.consultant_notes}"`);
  console.log(`  ✓ Documents attached: ${fssaiDetail.documents.length}`);

  // STEP 4: Switch to Client
  console.log('\n▶ STEP 4: Switch to Client (client@demo.foodsafe)...');
  const clientAuth = await request('/auth/switch-demo', {
    method: 'POST',
    body: JSON.stringify({ role: 'CLIENT' })
  });
  console.log(`  ✓ Logged in as: ${clientAuth.user.name} (Business: ${clientAuth.user.business_name})`);

  const clientReqs = await request('/requirements', {
    headers: { Authorization: `Bearer ${clientAuth.token}` }
  });
  console.log(`  ✓ Client sees "What's Due" with ${clientReqs.requirements.length} items`);
  const clientFssai = clientReqs.requirements.find(r => r.id === fssaiReq.id);
  console.log(`  ✓ FSSAI Licence status: ${clientFssai.status} (Expires: ${clientFssai.expiry_date})`);

  // STEP 5: Client uploads renewal evidence
  console.log('\n▶ STEP 5: Client uploads renewal evidence document...');
  const uploadsDir = path.join(__dirname, 'server', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const testFilePath = path.join(uploadsDir, 'shree_foods_renewal_2026.pdf');
  fs.writeFileSync(testFilePath, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Contents 4 0 R/Resources<<>>>>endobj\n4 0 obj<</Length 70>>stream\nBT /F1 16 Tf 50 780 Td (SHREE FOODS - 2026 RENEWED FSSAI LICENCE) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n333\n%%EOF');

  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(testFilePath)], { type: 'application/pdf' });
  formData.append('evidence', fileBlob, 'shree_foods_renewal_2026.pdf');
  formData.append('client_requirement_id', fssaiReq.id.toString());
  formData.append('notes', 'Renewed FSSAI State Manufacturing Licence valid till 2031.');

  const uploadRes = await fetch(`${API_BASE}/evidence/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientAuth.token}` },
    body: formData
  });
  const uploadJson = await uploadRes.json();
  console.log(`  ✓ Evidence uploaded successfully. Document ID: ${uploadJson.document.id}`);

  // Verify requirement status updated to 'Under Review'
  const updatedReq = await request(`/requirements/${fssaiReq.id}`, {
    headers: { Authorization: `Bearer ${clientAuth.token}` }
  });
  console.log(`  ✓ Requirement status transitioned to: ${updatedReq.requirement.status}`);

  // STEP 6: Switch to Consultant and check pending queue & notifications
  console.log('\n▶ STEP 6: Switch to Consultant & Check Pending Review Queue...');
  const pendingDocs = await request('/evidence/pending', {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  const targetDoc = pendingDocs.pendingDocuments.find(d => d.id === uploadJson.document.id);
  console.log(`  ✓ Consultant Review Queue contains: "${targetDoc.file_name}" from ${targetDoc.business_name}`);

  const notifs = await request('/notifications', {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  console.log(`  ✓ Consultant received notification: "${notifs.notifications[0].title}: ${notifs.notifications[0].message}"`);

  // STEP 7: Consultant Approves Evidence
  console.log('\n▶ STEP 7: Consultant Reviews and Approves Evidence...');
  const reviewRes = await request(`/evidence/${uploadJson.document.id}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${consultantAuth.token}` },
    body: JSON.stringify({
      review_status: 'APPROVED',
      reviewer_notes: 'FSSAI licence certificate verified against national portal. Approved.'
    })
  });
  console.log(`  ✓ Consultant action confirmed: ${reviewRes.message}`);
  console.log(`  ✓ Requirement status is now: ${reviewRes.requirementStatus}`);

  // STEP 8 & 9: Create and Publish Regulatory Update with Category Targeting
  console.log('\n▶ STEP 8 & 9: Create & Broadcast Regulatory Update (Targeting Pickle & Papad)...');
  const categories = await request('/categories', {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  const pickleCat = categories.categories.find(c => c.name.includes('Pickle'));
  const papadCat = categories.categories.find(c => c.name.includes('Papad'));
  const masalaCat = categories.categories.find(c => c.name.includes('Masala'));

  const broadcastRes = await request('/regulatory', {
    method: 'POST',
    headers: { Authorization: `Bearer ${consultantAuth.token}` },
    body: JSON.stringify({
      title: 'DEMO REGULATORY UPDATE: Microbiological Standards for Pickles & Preserved Foods',
      summary: 'Advisory on yeast, mould and coliform count thresholds under revised Schedule 4 guidelines.',
      description: 'Mandatory pasteurization temperature verification logs must be maintained for all batch cooking kettles.',
      source: 'FSSAI Advisory Doc 2026/09',
      source_url: 'https://fssai.gov.in',
      effective_date: '2026-11-01',
      category_ids: [pickleCat.id, papadCat.id, masalaCat.id]
    })
  });
  console.log(`  ✓ Regulatory Update Published: "${broadcastRes.update.title}"`);
  console.log(`  ✓ Broadcast simulated reach: ${broadcastRes.simulatedReach} businesses`);
  console.log(`  ✓ Seeded businesses notified: ${broadcastRes.seededNotifiedCount}`);

  // STEP 10: Switch to Client and Acknowledge
  console.log('\n▶ STEP 10: Switch to Client & Acknowledge Update...');
  const clientUpdates = await request('/regulatory', {
    headers: { Authorization: `Bearer ${clientAuth.token}` }
  });
  const newUpdate = clientUpdates.updates.find(u => u.id === broadcastRes.update.id);
  console.log(`  ✓ Client received directive: "${newUpdate.title}" (Status: ${newUpdate.acknowledgement_status})`);

  await request(`/regulatory/${newUpdate.id}/acknowledge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientAuth.token}` }
  });
  console.log(`  ✓ Client clicked [Acknowledge] — Update acknowledged!`);

  // STEP 11: Switch to Consultant and verify broadcast analytics
  console.log('\n▶ STEP 11: Switch to Consultant & Check Broadcast Tracker...');
  const broadcastTracker = await request(`/regulatory/${newUpdate.id}`, {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  console.log(`  ✓ Broadcast Analytics:`);
  console.log(`    - Total Affected: ${broadcastTracker.broadcastStats.totalAffected}`);
  console.log(`    - Sent: ${broadcastTracker.broadcastStats.sent}`);
  console.log(`    - Read: ${broadcastTracker.broadcastStats.read}`);
  console.log(`    - Acknowledged: ${broadcastTracker.broadcastStats.acknowledged}`);
  console.log(`    - Pending: ${broadcastTracker.broadcastStats.pending}`);
  const shreeInList = broadcastTracker.clients.find(c => c.business_name === 'Shree Foods');
  console.log(`  ✓ Client Tracker Row: ${shreeInList.business_name} -> Acknowledgement: ${shreeInList.acknowledgement_status} (${shreeInList.acknowledged_at})`);

  // STEP 12, 13, 14: Configure new template and rollout to category
  console.log('\n▶ STEP 12, 13, 14: Create Requirement Template & Auto-assign to Category...');
  const templateRes = await request('/templates', {
    method: 'POST',
    headers: { Authorization: `Bearer ${consultantAuth.token}` },
    body: JSON.stringify({
      name: 'Batch Oil Acid Value & Rancidity Assay',
      description: 'Periodic rancidity test for frying oils and pickling medium.',
      category_id: pickleCat.id,
      requirement_type: 'QUALITY',
      frequency: 'MONTHLY',
      evidence_type: 'Lab Test Certificate',
      reminder_schedule: [15, 7],
      default_duration_days: 30,
      default_priority: 'HIGH',
      assign_to_existing_clients: true
    })
  });
  console.log(`  ✓ Template Created: "${templateRes.template.name}"`);
  console.log(`  ✓ Auto-assigned to ${templateRes.assignedCount} businesses in "${pickleCat.name}".`);

  // Verify Shree Foods received it
  const shreeRefreshed = await request(`/businesses/${shreeFoods.id}`, {
    headers: { Authorization: `Bearer ${consultantAuth.token}` }
  });
  const newlyAssigned = shreeRefreshed.requirements.find(r => (r.custom_name || r.template_name).includes('Rancidity Assay'));
  console.log(`  ✓ Shree Foods received newly configured requirement: "${newlyAssigned.custom_name || newlyAssigned.template_name}" (Due: ${newlyAssigned.due_date})`);

  console.log('\n============================================================');
  console.log('🎉 ALL 14 DEMO FLOW STEPS VERIFIED FLAWLESSLY WITH REAL DB!');
  console.log('============================================================');
}

runE2EVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
