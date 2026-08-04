import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, ChevronDown, ArrowRight, RefreshCw, Calendar, UserCheck, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAdminAssistedRequests, assignAgentToRequest } from '../../store/slices/assistedManagement.slice';
import { fetchAllAgents } from '../../store/slices/admin.slice';
import { AssignAgentModal } from '../../components/admin/AssignAgentModal';
import { WorkflowStatus, AssistedRequestWithTenant } from '../../types/assistedManagement.types';
import { EmptyState } from '../../components/ui/EmptyState';
import FullscreenLoader from '../../components/ui/Loader';
import { normalizeRole } from '../../utils/roleUtils';

export function AdminAssistedRequests() {
  const dispatch = useAppDispatch();
  const {
    adminRequests,
    adminRequestsMeta,
    adminRequestsLoading,
    adminRequestsError
  } = useAppSelector((state) => state.assistedManagement);
  const { allAgents, agentsLoading } = useAppSelector((state) => state.admin);

  const [filters, setFilters] = useState<{
    city: string;
    workflowStatus: WorkflowStatus | '';
    assignedExecutiveId: string;
  }>({
    city: '',
    workflowStatus: '',
    assignedExecutiveId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssistedRequestWithTenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminAssistedRequests({ page: 1, limit: 20 }));
    dispatch(fetchAllAgents());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchAdminAssistedRequests({ 
      page: 1, 
      limit: 20,
      city: filters.city || undefined,
      workflowStatus: filters.workflowStatus || undefined,
      assignedExecutiveId: filters.assignedExecutiveId || undefined
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    dispatch(fetchAdminAssistedRequests({ 
      page: 1, 
      limit: 20,
      city: filters.city || undefined,
      workflowStatus: filters.workflowStatus || undefined,
      assignedExecutiveId: filters.assignedExecutiveId || undefined
    }));
  };

  const handleAssignAgent = (request: AssistedRequestWithTenant) => {
    setSelectedRequest(request);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async (agentId: string) => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await dispatch(assignAgentToRequest({
        requestId: selectedRequest.id,
        data: { executiveId: agentId }
      }));
      setAssignModalOpen(false);
      setSelectedRequest(null);
      handleRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWorkflowStatusColor = (status: WorkflowStatus) => {
    const colors: Record<WorkflowStatus, string> = {
      [WorkflowStatus.NEW]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      [WorkflowStatus.CONTACTED]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      [WorkflowStatus.SEARCHING]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      [WorkflowStatus.PROPERTIES_SHARED]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      [WorkflowStatus.VISITS_SCHEDULED]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      [WorkflowStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      [WorkflowStatus.CANCELLED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const filteredRequests = adminRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = !filters.city || request.city === filters.city;
    const matchesStatus = !filters.workflowStatus || request.workflowStatus === filters.workflowStatus;
    const matchesAgent = !filters.assignedExecutiveId || request.assignedExecutiveId === filters.assignedExecutiveId;
    
    return matchesSearch && matchesCity && matchesStatus && matchesAgent;
  });

  const uniqueCities = Array.from(new Set(adminRequests.map(r => r.city))).sort();
  const uniqueAgents = allAgents.filter(a => normalizeRole(a.role) === 'AGENT');

  if (adminRequestsLoading && adminRequests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-slate-950">
        <FullscreenLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 pt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-navy dark:text-white font-playfair">
              Assisted Requests
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage Property Concierge requests and agent assignments
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:text-white"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy dark:text-white"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <select
                  value={filters.workflowStatus}
                  onChange={(e) => handleFilterChange('workflowStatus', e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy dark:text-white"
                >
                  <option value="">All Status</option>
                  {Object.values(WorkflowStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select
                  value={filters.assignedExecutiveId}
                  onChange={(e) => handleFilterChange('assignedExecutiveId', e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy dark:text-white"
                >
                  <option value="">All Agents</option>
                  {uniqueAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-navy dark:bg-slate-200 text-white dark:text-navy rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {adminRequestsError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{adminRequestsError}</p>
          </div>
        )}

        {/* Table */}
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No assisted requests found"
            description={searchTerm || filters.city || filters.workflowStatus || filters.assignedExecutiveId 
              ? "Try adjusting your filters or search terms" 
              : "No assisted requests have been created yet"}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Assigned Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-navy dark:text-white">{request.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{request.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {request.city}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkflowStatusColor(request.workflowStatus)}`}>
                          {request.workflowStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {request.assignedExecutiveId ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>Assigned</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(request.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleAssignAgent(request)}
                          disabled={!!request.assignedExecutiveId || isSubmitting}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-navy dark:bg-slate-200 text-white dark:text-navy rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {request.assignedExecutiveId ? 'Assigned' : 'Assign Agent'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {adminRequestsMeta && adminRequestsMeta.totalPages && adminRequestsMeta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {adminRequestsMeta.page} of {adminRequestsMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={adminRequestsMeta.page === 1}
                    onClick={() => dispatch(fetchAdminAssistedRequests({ 
                      page: adminRequestsMeta.page - 1, 
                      limit: 20,
                      city: filters.city || undefined,
                      workflowStatus: filters.workflowStatus || undefined,
                      assignedExecutiveId: filters.assignedExecutiveId || undefined
                    }))}
                    className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                  >
                    Previous
                  </button>
                  <button
                    disabled={adminRequestsMeta.page === adminRequestsMeta.totalPages}
                    onClick={() => dispatch(fetchAdminAssistedRequests({ 
                      page: adminRequestsMeta.page + 1, 
                      limit: 20,
                      city: filters.city || undefined,
                      workflowStatus: filters.workflowStatus || undefined,
                      assignedExecutiveId: filters.assignedExecutiveId || undefined
                    }))}
                    className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assign Agent Modal */}
        {selectedRequest && (
          <AssignAgentModal
            isOpen={assignModalOpen}
            onClose={() => {
              setAssignModalOpen(false);
              setSelectedRequest(null);
            }}
            onConfirm={handleConfirmAssign}
            requestName={selectedRequest.name}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
