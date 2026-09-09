import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { ComplianceCommandCentre } from './views/ComplianceCommandCentre';
import { ClientComplianceProfile } from './views/ClientComplianceProfile';
import { WhatsDue } from './views/WhatsDue';
import { MyTasksView } from './views/MyTasksView';
import { RequirementTemplatesView } from './views/RequirementTemplatesView';
import { RegulatoryUpdateCentre } from './views/RegulatoryUpdateCentre';
import { ClientRegulatoryView } from './views/ClientRegulatoryView';
import { DocumentReviewQueue } from './views/DocumentReviewQueue';
import { ClientDocumentsView } from './views/ClientDocumentsView';
import { ComplianceCalendar } from './views/ComplianceCalendar';
import { AuditLogView } from './views/AuditLogView';
import { BusinessesListView } from './views/BusinessesListView';
import { EvidenceUploadModal } from './components/EvidenceUploadModal';
import { EvidenceReviewModal } from './components/EvidenceReviewModal';
import { BusinessCreateModal } from './components/BusinessCreateModal';
import { RegulatoryAlertModal } from './components/RegulatoryAlertModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsView } from './views/SettingsView';
import { ClientRequirement, EvidenceDocument } from './types';
import { apiRequest } from './api';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  
  // Active view state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  // Modals state
  const [uploadReq, setUploadReq] = useState<ClientRequirement | null>(null);
  const [reviewDoc, setReviewDoc] = useState<EvidenceDocument | null>(null);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  // Fetch pending review count periodically for consultant badge
  const fetchPendingCount = async () => {
    if (user?.role === 'CONSULTANT') {
      try {
        const data = await apiRequest('/evidence/pending');
        setPendingReviewCount((data.pendingDocuments || []).length);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (user?.role === 'CONSULTANT') {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Adjust default view when persona changes
  useEffect(() => {
    if (user) {
      if (user.role === 'CLIENT') {
        setCurrentView('whats-due');
      } else if (user.role === 'MANAGER') {
        setCurrentView('tasks');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [user?.role]);

  const handleNavigate = (view: string, data?: any) => {
    if (view === 'client-profile') {
      if (data?.businessId) {
        setSelectedBusinessId(data.businessId);
      } else if (!selectedBusinessId) {
        setSelectedBusinessId(1);
      }
    }
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fbfbfa',
          color: '#191919'
        }}
      >
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e2dc', borderTopColor: '#1e3a2f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.3px' }}>FOODSAFE</div>
        <div style={{ fontSize: '12px', color: '#777770', marginTop: '4px' }}>Loading workspace...</div>
      </div>
    );
  }

  // FIRST SCREEN MUST BE LOGIN
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        pendingReviewCount={pendingReviewCount}
      />

      {/* Main Container */}
      <div className="main-content">
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        <main className="content-body">
          <ErrorBoundary>
            {/* Universal Views across roles */}
            {currentView === 'settings' && (
              <SettingsView />
            )}

            {currentView === 'client-profile' && (
              <ClientComplianceProfile
                businessId={selectedBusinessId || user?.client_id || 1}
                onBack={() => handleNavigate(user?.role === 'CONSULTANT' ? 'businesses' : 'whats-due')}
                onOpenUpload={(req) => setUploadReq(req)}
                onOpenReviewModal={(doc, req) => setReviewDoc(doc)}
              />
            )}

            {/* CONSULTANT VIEWS */}
            {user?.role === 'CONSULTANT' && (
              <>
                {currentView === 'dashboard' && (
                  <ComplianceCommandCentre
                    onNavigate={handleNavigate}
                    onOpenAddBusiness={() => setShowAddBusiness(true)}
                  />
                )}

                {currentView === 'businesses' && (
                  <BusinessesListView
                    onSelectBusiness={(id) => handleNavigate('client-profile', { businessId: id })}
                    onOpenAddBusiness={() => setShowAddBusiness(true)}
                  />
                )}

                {currentView === 'templates' && (
                  <RequirementTemplatesView />
                )}

                {currentView === 'regulatory' && (
                  <RegulatoryUpdateCentre />
                )}

                {currentView === 'documents-review' && (
                  <DocumentReviewQueue />
                )}

                {currentView === 'calendar' && (
                  <ComplianceCalendar
                    onSelectBusiness={(id) => handleNavigate('client-profile', { businessId: id })}
                  />
                )}

                {currentView === 'audit' && (
                  <AuditLogView />
                )}
              </>
            )}

            {/* CLIENT & QA MANAGER VIEWS */}
            {(user?.role === 'CLIENT' || user?.role === 'MANAGER' || user?.role === 'STAFF') && (
              <>
                {currentView === 'whats-due' && (
                  <WhatsDue
                    onOpenUpload={(req) => setUploadReq(req)}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentView === 'dashboard' && (
                  <WhatsDue
                    onOpenUpload={(req) => setUploadReq(req)}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentView === 'tasks' && (
                  <MyTasksView
                    onOpenUpload={(req) => setUploadReq(req)}
                    onOpenRegulatory={() => handleNavigate('regulatory')}
                  />
                )}

                {currentView === 'regulatory' && (
                  <ClientRegulatoryView />
                )}

                {currentView === 'documents' && (
                  <ClientDocumentsView
                    onOpenUpload={(req) => setUploadReq(req)}
                  />
                )}
              </>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Prominent Regulatory Alert Modal for Clients/Managers with unacknowledged directives */}
      <RegulatoryAlertModal />

      {/* Upload Evidence Modal */}
      {uploadReq && (
        <EvidenceUploadModal
          requirement={uploadReq}
          onClose={() => setUploadReq(null)}
          onSuccess={() => {
            fetchPendingCount();
            showToast('Evidence Uploaded', 'Document submitted for consultant review.', 'success');
            // Trigger refresh by re-navigating
            setCurrentView(prev => prev);
          }}
        />
      )}

      {/* Review Evidence Modal (for Consultant in profile view) */}
      {reviewDoc && (
        <EvidenceReviewModal
          document={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onSuccess={() => {
            fetchPendingCount();
            showToast('Document Reviewed', 'Verification decision recorded.', 'success');
            if (selectedBusinessId) {
              handleNavigate('client-profile', { businessId: selectedBusinessId });
            }
          }}
        />
      )}

      {/* Add Business Modal */}
      {showAddBusiness && (
        <BusinessCreateModal
          onClose={() => setShowAddBusiness(false)}
          onSuccess={(newBizId) => {
            showToast('Business Registered', 'New food manufacturing facility enrolled.', 'success');
            handleNavigate('client-profile', { businessId: newBizId });
          }}
        />
      )}
    </div>
  );
};

export default App;
