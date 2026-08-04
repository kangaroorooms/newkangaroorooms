import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssignedProperties, fetchAssignedTenants, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, createPropertyNote, updatePropertyNote, deletePropertyNote } from '../../store/slices/agent.slice';
import { fetchAssignedRequests, updateWorkflowStatus, addRecommendation, updateRecommendation, deleteRecommendation, fetchRecommendedProperties } from '../../store/slices/assistedManagement.slice';
import { createOwnerLead, fetchOwnerLeads } from '../../store/slices/ownerLead.slice';
import { showToast } from '../../store/slices/ui.slice';
import { Building, Users, Bell, MapPin, Calendar, Phone, Mail, CheckCircle, Clock, AlertCircle, RefreshCw, FileText, Plus, Edit2, Trash2, Home, Star, ChevronDown, ChevronUp, ArrowRight, Sparkles, Search, BadgeCheck, Clock3, User, PhoneCall, MessageCircle, Share2 } from 'lucide-react';
import { PropertyNoteModal } from '../../components/agent/PropertyNoteModal';
import { DeleteNoteConfirmModal } from '../../components/agent/DeleteNoteConfirmModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { GridSkeleton, ListItemSkeleton } from '../../components/ui/Skeletons';
import { ModalWrapper } from '../../components/ui/ModalWrapper';
import { LeadForm } from '../../components/owner-leads/LeadForm';
import { AgentNote, AgentPropertyView } from '../../types/agent.types';
import { WorkflowStatusBadge } from '../../components/agent/WorkflowStatusBadge';
import { RecommendationCard } from '../../components/agent/RecommendationCard';
import { AddRecommendationModal } from '../../components/agent/AddRecommendationModal';
import { EditRecommendationModal } from '../../components/agent/EditRecommendationModal';
import { AssistedRequestWithTenant, RecommendedProperty, WorkflowStatus } from '../../types/assistedManagement.types';
import { OwnerLead, OwnerLeadFormInput, OwnerLeadStatus } from '../../types/ownerLead.types';
import { getOwnerLeadWhatsAppUrl, shareOwnerLead } from '../../utils/ownerLeadActions';

type DashboardTab = 'properties' | 'tenants' | 'notifications' | 'assisted' | 'ownerLeads';

export function AgentDashboard() {
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const {
    properties = [],
    tenants = [],
    notifications = [],
    loading,
    error,
    unreadCount = 0,
    myNotes = {},
  } = useAppSelector((state) => state.agent);
  const {
    assignedRequests = [],
    assignedRequestsLoading,
    assignedRequestsError,
    recommendedProperties,
    recommendedPropertiesLoading,
    recommendedPropertiesError,
    addRecommendationLoading,
    updateRecommendationLoading,
    deleteRecommendationLoading,
    updateWorkflowStatusLoading
  } = useAppSelector((state) => state.assistedManagement);
  const {
    items: ownerLeads = [],
    loading: ownerLeadLoading,
    error: ownerLeadError,
  } = useAppSelector((state) => state.ownerLead);

  const [activeTab, setActiveTab] = useState<DashboardTab>('properties');

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AgentPropertyView | null>(null);
  const [selectedNote, setSelectedNote] = useState<AgentNote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assisted requests modal state
  const [addRecommendationModalOpen, setAddRecommendationModalOpen] = useState(false);
  const [editRecommendationModalOpen, setEditRecommendationModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssistedRequestWithTenant | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendedProperty | null>(null);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [isOwnerLeadModalOpen, setIsOwnerLeadModalOpen] = useState(false);
  const [isOwnerLeadSubmitting, setIsOwnerLeadSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAssignedProperties());
    dispatch(fetchAssignedTenants());
    dispatch(fetchNotifications({ page: 1 }));
    dispatch(fetchAssignedRequests());
    dispatch(fetchOwnerLeads({ page: 1, limit: 20 }));
  }, [dispatch]);

  const currentLoading = activeTab === 'assisted'
    ? assignedRequestsLoading
    : activeTab === 'ownerLeads'
      ? ownerLeadLoading
      : loading?.[activeTab];
  const currentError = activeTab === 'assisted'
    ? assignedRequestsError
    : activeTab === 'ownerLeads'
      ? ownerLeadError
      : error?.[activeTab];

  const stats = useMemo(
    () => [
      {
        key: 'properties' as DashboardTab,
        label: 'Assigned Properties',
        count: properties.length,
        icon: Building,
        iconClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      },
      {
        key: 'tenants' as DashboardTab,
        label: 'Assigned Tenants',
        count: tenants.length,
        icon: Users,
        iconClass:
          'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      },
      {
        key: 'assisted' as DashboardTab,
        label: 'Assisted Requests',
        count: assignedRequests.length,
        icon: Home,
        iconClass:
          'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      },
      {
        key: 'notifications' as DashboardTab,
        label: 'Unread Notifications',
        count: unreadCount,
        icon: Bell,
        iconClass:
          'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      },
      {
        key: 'ownerLeads' as DashboardTab,
        label: 'Owner Leads',
        count: ownerLeads.length,
        icon: Star,
        iconClass:
          'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      },
    ],
    [properties.length, tenants.length, assignedRequests.length, unreadCount, ownerLeads.length]
  );

  const handleRefresh = () => {
    switch (activeTab) {
      case 'properties':
        dispatch(fetchAssignedProperties());
        break;
      case 'tenants':
        dispatch(fetchAssignedTenants());
        break;
      case 'notifications':
        dispatch(fetchNotifications({ page: 1 }));
        break;
      case 'assisted':
        dispatch(fetchAssignedRequests());
        break;
      case 'ownerLeads':
        dispatch(fetchOwnerLeads({ page: 1, limit: 20 }));
        break;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPropertyNotes = (propertyId: string): AgentNote[] => {
    return myNotes?.[propertyId] || [];
  };

  // ---------------------------
  // Note Handlers
  // ---------------------------
  const resetNoteState = () => {
    setSelectedProperty(null);
    setSelectedNote(null);
    setNoteModalOpen(false);
    setDeleteModalOpen(false);
  };

  const handleOpenCreateNote = (property: AgentPropertyView) => {
    setSelectedProperty(property);
    setSelectedNote(null);
    setNoteModalOpen(true);
  };

  const handleOpenEditNote = (property: AgentPropertyView, note: AgentNote) => {
    setSelectedProperty(property);
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const handleOpenDeleteNote = (property: AgentPropertyView, note: AgentNote) => {
    setSelectedProperty(property);
    setSelectedNote(note);
    setDeleteModalOpen(true);
  };

  const handleSaveNote = async (content: string) => {
    if (!selectedProperty) return;

    setIsSubmitting(true);
    try {
      if (selectedNote) {
        await dispatch(
          updatePropertyNote({
            noteId: selectedNote.id,
            propertyId: selectedProperty.id,
            content,
          })
        ).unwrap();
        dispatch(showToast({
          message: 'Note updated successfully!',
          type: 'success'
        }));
      } else {
        await dispatch(
          createPropertyNote({
            propertyId: selectedProperty.id,
            content,
          })
        ).unwrap();
        dispatch(showToast({
          message: 'Note created successfully!',
          type: 'success'
        }));
      }

      resetNoteState();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save note. Please try again.';
      dispatch(showToast({
        message: errorMessage,
        type: 'error'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedProperty || !selectedNote) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        deletePropertyNote({
          noteId: selectedNote.id,
          propertyId: selectedProperty.id,
        })
      ).unwrap();

      resetNoteState();
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  const openOwnerLeadModal = () => setIsOwnerLeadModalOpen(true);
  const closeOwnerLeadModal = () => setIsOwnerLeadModalOpen(false);

  const handleCreateOwnerLead = async (payload: OwnerLeadFormInput) => {
    setIsOwnerLeadSubmitting(true);

    try {
      await dispatch(createOwnerLead(payload)).unwrap();
      setIsOwnerLeadModalOpen(false);
      dispatch(fetchOwnerLeads({ page: 1, limit: 20 }));
      dispatch(showToast({ message: 'Owner lead created', type: 'success' }));
    } catch (error) {
      const message = typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Failed to create owner lead';

      dispatch(showToast({ message, type: 'error' }));
      throw error;
    } finally {
      setIsOwnerLeadSubmitting(false);
    }
  };

  // Assisted requests handlers
  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
        dispatch(fetchRecommendedProperties(requestId));
      }
      return newSet;
    });
  };

  const handleUpdateWorkflowStatus = async (requestId: string, status: WorkflowStatus) => {
    try {
      await dispatch(updateWorkflowStatus({ requestId, data: { workflowStatus: status } }));
    } catch {}
  };

  const handleAddRecommendation = (request: AssistedRequestWithTenant) => {
    setSelectedRequest(request);
    setAddRecommendationModalOpen(true);
  };

  const handleConfirmAddRecommendation = async (propertyId: string, priority: number, notes?: string) => {
    if (!selectedRequest) return;
    try {
      await dispatch(addRecommendation({
        requestId: selectedRequest.id,
        data: { propertyId, priority, notes }
      }));
      setAddRecommendationModalOpen(false);
      setSelectedRequest(null);
      dispatch(fetchRecommendedProperties(selectedRequest.id));
    } catch {}
  };

  const handleEditRecommendation = (recommendation: RecommendedProperty) => {
    setSelectedRecommendation(recommendation);
    setEditRecommendationModalOpen(true);
  };

  const handleConfirmEditRecommendation = async (priority: number, notes?: string) => {
    if (!selectedRecommendation) return;
    try {
      await dispatch(updateRecommendation({
        recommendationId: selectedRecommendation.id,
        data: { priority, notes }
      }));
      setEditRecommendationModalOpen(false);
      setSelectedRecommendation(null);
      if (selectedRequest) {
        dispatch(fetchRecommendedProperties(selectedRequest.id));
      }
    } catch {}
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (!selectedRequest) return;
    try {
      await dispatch(deleteRecommendation({
        recommendationId,
        requestId: selectedRequest.id
      }));
      if (selectedRequest) {
        dispatch(fetchRecommendedProperties(selectedRequest.id));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream pb-8 pt-4 transition-colors duration-300 dark:bg-slate-950 sm:pb-12 sm:pt-20">
      {/* Modals */}
      <PropertyNoteModal
        isOpen={noteModalOpen}
        onClose={resetNoteState}
        onSave={handleSaveNote}
        propertyTitle={selectedProperty?.title || ''}
        existingNote={selectedNote}
        isSubmitting={isSubmitting}
      />

      <DeleteNoteConfirmModal
        isOpen={deleteModalOpen}
        onClose={resetNoteState}
        onConfirm={handleDeleteNote}
        propertyTitle={selectedProperty?.title || ''}
        isSubmitting={isSubmitting}
      />

      <ModalWrapper
        isOpen={isOwnerLeadModalOpen}
        onClose={closeOwnerLeadModal}
        size="xl"
        closeButton
        contentClassName="p-0"
      >
        <LeadForm isLoading={isOwnerLeadSubmitting} onSubmit={handleCreateOwnerLead} onCancel={closeOwnerLeadModal} />
      </ModalWrapper>

      <AddRecommendationModal
        isOpen={addRecommendationModalOpen}
        onClose={() => {
          setAddRecommendationModalOpen(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleConfirmAddRecommendation}
        isSubmitting={addRecommendationLoading}
      />

      <EditRecommendationModal
        isOpen={editRecommendationModalOpen}
        onClose={() => {
          setEditRecommendationModalOpen(false);
          setSelectedRecommendation(null);
        }}
        onConfirm={handleConfirmEditRecommendation}
        recommendation={selectedRecommendation}
        isSubmitting={updateRecommendationLoading}
      />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.7)] dark:border-slate-700 sm:rounded-[32px] sm:p-6 md:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Owner acquisition workspace
              </div>
              <h1 className="font-playfair text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
                Welcome back, {user?.name || 'Agent'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base">
                Keep momentum high with a calmer, faster view of your assignments, property owners, and the next best follow-up.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              <button
                type="button"
                onClick={openOwnerLeadModal}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> New owner lead
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur sm:p-4">
              <div className="text-sm text-slate-300">Priority leads</div>
              <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{ownerLeads.filter((lead) => lead.status === 'NEW' || lead.status === 'CONTACTED').length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur sm:p-4">
              <div className="text-sm text-slate-300">Assigned today</div>
              <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{ownerLeads.filter((lead) => new Date(lead.createdAt).toDateString() === new Date().toDateString()).length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur sm:p-4 sm:col-span-2 lg:col-span-1">
              <div className="text-sm text-slate-300">Active workspace</div>
              <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{activeTab === 'ownerLeads' ? 'Owner leads' : 'Operations'}</div>
            </div>
          </div>
        </motion.header>

        <StatsCards stats={stats} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Panel */}
        <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:rounded-2xl">
          <DashboardPanelHeader
            activeTab={activeTab}
            loading={currentLoading}
            onRefresh={handleRefresh}
          />

          <div className="p-4 sm:p-6">
            {currentError && (
              <ErrorBanner message={currentError} onRetry={handleRefresh} />
            )}

            {currentLoading ? (
              <DashboardLoadingState activeTab={activeTab} />
            ) : (
              <>
                {activeTab === 'properties' && (
                  <PropertiesTab
                    properties={properties}
                    getPropertyNotes={getPropertyNotes}
                    onCreateNote={handleOpenCreateNote}
                    onEditNote={handleOpenEditNote}
                    onDeleteNote={handleOpenDeleteNote}
                    formatDate={formatDate}
                    notesLoading={loading?.notes}
                  />
                )}

                {activeTab === 'tenants' && (
                  <TenantsTab tenants={tenants} formatDate={formatDate} />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsTab
                    notifications={notifications}
                    unreadCount={unreadCount}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    onMarkAllRead={() => dispatch(markAllNotificationsAsRead())}
                    onMarkRead={(id: string) => dispatch(markNotificationAsRead(id))}
                  />
                )}

                {activeTab === 'assisted' && (
                  <AssistedTab
                    requests={assignedRequests}
                    expandedRequests={expandedRequests}
                    toggleRequestExpansion={toggleRequestExpansion}
                    onUpdateWorkflowStatus={handleUpdateWorkflowStatus}
                    onAddRecommendation={handleAddRecommendation}
                    onEditRecommendation={handleEditRecommendation}
                    onDeleteRecommendation={handleDeleteRecommendation}
                    recommendedProperties={recommendedProperties}
                    recommendedPropertiesLoading={recommendedPropertiesLoading}
                    formatDate={formatDate}
                    updateWorkflowStatusLoading={updateWorkflowStatusLoading}
                    deleteRecommendationLoading={deleteRecommendationLoading}
                  />
                )}
                {activeTab === 'ownerLeads' && (
                  <OwnerLeadsTab
                    leads={ownerLeads}
                    loading={ownerLeadLoading}
                    error={ownerLeadError}
                    onCreateLead={openOwnerLeadModal}
                    currentUserId={user?.id || ''}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   SUBCOMPONENTS
========================================================= */

function StatsCards({
  stats,
  activeTab,
  onTabChange,
}: {
  stats: {
    key: DashboardTab;
    label: string;
    count: number;
    icon: React.ElementType;
    iconClass: string;
  }[];
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5 sm:mb-8">
      {stats.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;

        return (
          <motion.button
            key={item.key}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={`min-h-[104px] rounded-2xl border px-3 py-4 text-left shadow-sm transition-all duration-200 sm:min-h-[112px] sm:px-5 sm:py-6 ${
              isActive
                ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-[0_12px_32px_-8px_rgba(217,119,6,0.2)] dark:border-amber-800/40 dark:from-amber-900/30 dark:to-amber-900/10 dark:shadow-none'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
              <div className={`rounded-xl p-2 ${isActive ? 'bg-amber-200 dark:bg-amber-700/50' : item.iconClass} sm:p-2.5`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className={`text-lg font-bold tracking-tight sm:text-2xl ${isActive ? 'text-amber-900 dark:text-amber-100' : 'text-slate-900 dark:text-white'}`}>
                {item.count}
              </span>
            </div>
            <h3 className={`text-xs font-semibold leading-snug sm:text-sm ${isActive ? 'text-amber-900 dark:text-amber-100' : 'text-slate-700 dark:text-slate-200'}`}>
              {item.label}
            </h3>
          </motion.button>
        );
      })}
    </div>
  );
}

function DashboardPanelHeader({
  activeTab,
  loading,
  onRefresh,
}: {
  activeTab: DashboardTab;
  loading?: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <h2 className="text-lg font-bold text-navy dark:text-white sm:text-xl">
        {activeTab === 'properties' && 'My Properties'}
        {activeTab === 'tenants' && 'My Tenants'}
        {activeTab === 'notifications' && 'Notifications'}
        {activeTab === 'assisted' && 'Assisted Requests'}
        {activeTab === 'ownerLeads' && 'Owner Leads'}
      </h2>

      <button
        onClick={onRefresh}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center self-start rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-navy dark:hover:bg-slate-700 dark:hover:text-white sm:self-auto"
        title="Refresh"
        aria-label="Refresh current tab"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-sm sm:text-base">{message}</p>
      <button
        onClick={onRetry}
        className="ml-auto text-sm font-medium underline hover:text-red-700 dark:hover:text-red-300"
      >
        Retry
      </button>
    </div>
  );
}

function DashboardLoadingState({ activeTab }: { activeTab: DashboardTab }) {
  if (activeTab === 'notifications') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return <GridSkeleton columns={2} count={2} />;
}

/* =========================================================
   PROPERTIES TAB
========================================================= */

function PropertiesTab({
  properties,
  getPropertyNotes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  formatDate,
  notesLoading,
}: {
  properties: AgentPropertyView[];
  getPropertyNotes: (propertyId: string) => AgentNote[];
  onCreateNote: (property: AgentPropertyView) => void;
  onEditNote: (property: AgentPropertyView, note: AgentNote) => void;
  onDeleteNote: (property: AgentPropertyView, note: AgentNote) => void;
  formatDate: (date?: string) => string;
  notesLoading?: boolean;
}) {
  if (!properties.length) {
    return (
      <EmptyState
        icon={Building}
        title="No Properties Assigned"
        description="You don't have any properties assigned yet. Check back soon or contact your supervisor."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-7">
      {properties.map((property) => {
        const propertyNotes = getPropertyNotes(property.id);

        return (
          <div
            key={property.id}
            className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50 p-5 sm:p-6 hover:shadow-lg hover:border-amber-200/50 dark:hover:border-amber-800/30 transition-all duration-200 group"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                  {property.title}
                </h3>

                <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">
                    {property.location}, {property.city}
                  </span>
                </div>
              </div>

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold self-start whitespace-nowrap ${
                  property.isActive
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {property.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <InfoRow
                label="Price"
                value={`₹${property.pricePerMonth?.toLocaleString?.() || 0}/mo`}
              />
              <InfoRow label="Type" value={property.roomType || 'N/A'} />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Owner Details
              </p>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-navy dark:text-white truncate">
                  {property.owner?.name || 'Owner'}
                </span>

                <div className="flex gap-2 shrink-0">
                  {property.owner?.phone && (
                    <a
                      href={`tel:${property.owner.phone}`}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      title="Call Owner"
                      aria-label={`Call ${property.owner.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  {property.owner?.email && (
                    <a
                      href={`mailto:${property.owner.email}`}
                      className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      title="Email Owner"
                      aria-label={`Email ${property.owner.name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {property.assignment?.assignmentNotes && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-xs text-yellow-800 dark:text-yellow-400">
                <span className="font-bold">Assignment Note:</span>{' '}
                {property.assignment.assignmentNotes}
              </div>
            )}

            <AgentNotesSection
              property={property}
              notes={propertyNotes}
              formatDate={formatDate}
              notesLoading={notesLoading}
              onCreateNote={onCreateNote}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
            />
          </div>
        );
      })}
    </div>
  );
}

function AgentNotesSection({
  property,
  notes,
  formatDate,
  notesLoading,
  onCreateNote,
  onEditNote,
  onDeleteNote,
}: {
  property: AgentPropertyView;
  notes: AgentNote[];
  formatDate: (date?: string) => string;
  notesLoading?: boolean;
  onCreateNote: (property: AgentPropertyView) => void;
  onEditNote: (property: AgentPropertyView, note: AgentNote) => void;
  onDeleteNote: (property: AgentPropertyView, note: AgentNote) => void;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3 h-3" />
          My Notes
        </p>

        <button
          onClick={() => onCreateNote(property)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 min-h-[44px]"
          disabled={notesLoading}
        >
          <Plus className="w-3 h-3" />
          Add Note
        </button>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 group"
            >
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap break-words">
                {note.content}
              </p>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {formatDate(note.createdAt)}
                  {note.updatedAt !== note.createdAt && ' (edited)'}
                </span>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditNote(property, note)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit Note"
                    aria-label="Edit note"
                    disabled={notesLoading}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteNote(property, note)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Note"
                    aria-label="Delete note"
                    disabled={notesLoading}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No notes yet. Add a note for the owner/tenant to see.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   TENANTS TAB
========================================================= */

function TenantsTab({
  tenants,
  formatDate,
}: {
  tenants: any[];
  formatDate: (date?: string) => string;
}) {
  if (!tenants.length) {
    return (
      <EmptyState
        icon={Users}
        title="No Tenants Assigned"
        description="You don't have any tenants assigned yet. They will appear here once you're assigned."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
      {tenants.map((tenant) => (
        <div
          key={tenant.id}
          className="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold text-navy dark:text-white text-lg mb-1 truncate">
                {tenant.name}
              </h3>

              <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                <MapPin className="w-4 h-4 mr-1 shrink-0" />
                <span className="truncate">{tenant.city || 'No city specified'}</span>
              </div>
            </div>

            <span className="text-xs text-slate-400 shrink-0">
              Assigned {formatDate(tenant.assignment?.assignedAt)}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            {tenant.email && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${tenant.email}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 break-all"
                >
                  {tenant.email}
                </a>
              </div>
            )}

            {tenant.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${tenant.phone}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {tenant.phone}
                </a>
              </div>
            )}
          </div>

          {tenant.assignment?.reason && (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-navy dark:text-white">
                Assignment Reason:
              </span>{' '}
              {tenant.assignment.reason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS TAB
========================================================= */

function NotificationsTab({
  notifications,
  unreadCount,
  formatDate,
  formatTime,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: any[];
  unreadCount: number;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onMarkAllRead}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => !notification.isRead && onMarkRead(notification.id)}
            className={`w-full text-left p-4 rounded-2xl border transition-colors ${
              notification.isRead
                ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
            }`}
          >
            <div className="flex gap-4">
              <div
                className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                  notification.isRead
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                  <h4
                    className={`font-medium ${
                      notification.isRead
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-navy dark:text-white'
                    }`}
                  >
                    {notification.title}
                  </h4>

                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(notification.createdAt)} •{' '}
                    {formatTime(notification.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {notification.message}
                </p>

                {notification.payload && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 mt-2">
                    {notification.payload.propertyTitle && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {notification.payload.propertyTitle}
                      </span>
                    )}

                    {notification.payload.tenantName && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {notification.payload.tenantName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
/* =========================================================
   OWNER LEADS TAB
========================================================= */
function OwnerLeadsTab({
  leads,
  loading,
  error,
  onCreateLead,
  currentUserId,
}: {
  leads: OwnerLead[];
  loading?: boolean;
  error?: string | null;
  onCreateLead: () => void;
  currentUserId: string;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OwnerLeadStatus>('all');

  const filteredLeads = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const haystack = `${lead.ownerName} ${lead.phone} ${lead.city} ${lead.leadSource}`.toLowerCase();
      const matchesSearch = !normalized || haystack.includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [leads, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    return [
      { label: "Today's leads", value: leads.filter((lead) => new Date(lead.createdAt).toDateString() === today.toDateString()).length, icon: Sparkles, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
      { label: 'This week', value: leads.filter((lead) => new Date(lead.createdAt) >= weekAgo).length, icon: Calendar, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
      { label: 'Needs follow-up', value: leads.filter((lead) => lead.status === 'NEW' || lead.status === 'CONTACTED').length, icon: Clock3, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
      { label: 'Converted', value: leads.filter((lead) => lead.status === 'CONVERTED').length, icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
      { label: 'Rejected', value: leads.filter((lead) => lead.status === 'REJECTED').length, icon: AlertCircle, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
      { label: 'Expired', value: leads.filter((lead) => lead.status === 'EXPIRED').length, icon: Clock, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    ];
  }, [leads]);

  if (loading) {
    return <GridSkeleton columns={2} count={2} />;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-gradient-to-r from-white via-amber-50/40 to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-5">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5" /> CRM workspace
          </div>
          <h2 className="text-xl font-semibold text-navy dark:text-white">Owner leads</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track field-acquired leads and move them forward without friction.</p>
        </div>
        <button
          type="button"
          onClick={onCreateLead}
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          <Plus className="mr-2 h-4 w-4" /> New owner lead
        </button>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="owner-lead-search">
              Search leads
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="owner-lead-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone, city or source"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
            >
              All
            </button>
            {(['NEW', 'CONTACTED', 'INTERESTED', 'PAYMENT_PENDING', 'CONVERTED'] as OwnerLeadStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${statusFilter === status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
              >
                {status.replace(/_/g, ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
              <div className={`inline-flex rounded-2xl p-2 ${stat.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredLeads.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <EmptyState
            icon={Star}
            title="No owner leads yet"
            description="Create your first lead from the button above and it will appear here instantly."
          />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filteredLeads.map((lead) => {
            const isMyLead = lead.createdByAgentId === currentUserId;
            const isAssigned = !isMyLead && lead.assignedAgentId === currentUserId;
            const isShared = !isMyLead && !isAssigned && lead.shares?.some((share) => share.sharedWithId === currentUserId && share.sharedWith);
            const tag = isMyLead ? 'My Lead' : isAssigned ? 'Assigned' : isShared ? 'Shared' : undefined;

            return (
              <div key={lead.id} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{lead.ownerName}</h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {tag || 'Lead'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lead.phone} • {lead.city}</p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" />
                    {new Date(lead.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${lead.phone}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                    <PhoneCall className="h-4 w-4" /> Call
                  </a>
                  <a
                    href={getOwnerLeadWhatsAppUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => void shareOwnerLead(lead)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ASSISTED REQUESTS TAB
========================================================= */

function AssistedTab({
  requests,
  expandedRequests,
  toggleRequestExpansion,
  onUpdateWorkflowStatus,
  onAddRecommendation,
  onEditRecommendation,
  onDeleteRecommendation,
  recommendedProperties,
  recommendedPropertiesLoading,
  formatDate,
  updateWorkflowStatusLoading,
  deleteRecommendationLoading
}: {
  requests: AssistedRequestWithTenant[];
  expandedRequests: Set<string>;
  toggleRequestExpansion: (requestId: string) => void;
  onUpdateWorkflowStatus: (requestId: string, status: WorkflowStatus) => void;
  onAddRecommendation: (request: AssistedRequestWithTenant) => void;
  onEditRecommendation: (recommendation: RecommendedProperty) => void;
  onDeleteRecommendation: (recommendationId: string) => void;
  recommendedProperties: Record<string, RecommendedProperty[]>;
  recommendedPropertiesLoading: Record<string, boolean>;
  formatDate: (date?: string) => string;
  updateWorkflowStatusLoading: boolean;
  deleteRecommendationLoading: boolean;
}) {
  if (!requests.length) {
    return (
      <EmptyState
        icon={Home}
        title="No Assisted Requests"
        description="You don't have any assisted requests assigned yet. They will appear here once you're assigned."
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isExpanded = expandedRequests.has(request.id);
        const recommendations = recommendedProperties[request.id] || [];
        const isLoading = recommendedPropertiesLoading[request.id];

        return (
          <div
            key={request.id}
            className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden"
          >
            {/* Request Header */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-800">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-navy dark:text-white text-lg truncate">
                      {request.name}
                    </h3>
                    <WorkflowStatusBadge status={request.workflowStatus} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {request.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRequestExpansion(request.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show Recommendations
                      </>
                    )}
                    {recommendations.length > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                        {recommendations.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700 p-4 sm:p-5 bg-slate-50 dark:bg-slate-700/50">
                {/* Workflow Status Update */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Update Workflow Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(WorkflowStatus).map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateWorkflowStatus(request.id, status)}
                        disabled={updateWorkflowStatusLoading || request.workflowStatus === status}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          request.workflowStatus === status
                            ? 'bg-navy dark:bg-white text-white dark:text-navy'
                            : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendations Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-navy dark:text-white flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Recommended Properties
                    </h4>
                    <button
                      onClick={() => onAddRecommendation(request)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-navy dark:bg-slate-200 text-white dark:text-navy rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Recommendation
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy dark:border-white mx-auto"></div>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((recommendation) => (
                        <RecommendationCard
                          key={recommendation.id}
                          recommendation={recommendation}
                          onEdit={onEditRecommendation}
                          onDelete={onDeleteRecommendation}
                          isDeleting={deleteRecommendationLoading}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recommendations yet</p>
                      <p className="text-sm">Click "Add Recommendation" to suggest properties</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   SMALL UI HELPERS
========================================================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}:</span>
      <span className="font-medium text-navy dark:text-white text-right">{value}</span>
    </div>
  );
}
