import React, { useEffect, useState } from 'react';
import { X, Search, User as UserIcon, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAllAgents } from '../../store/slices/admin.slice';
import { User, Role } from '../../types/api.types';

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: string) => void;
  requestName: string;
  isSubmitting?: boolean;
}

export function AssignAgentModal({
  isOpen,
  onClose,
  onConfirm,
  requestName,
  isSubmitting = false
}: AssignAgentModalProps) {
  const dispatch = useAppDispatch();
  const {
    allAgents,
    agentsLoading
  } = useAppSelector((state) => state.admin);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllAgents());
      setSearchTerm('');
      setSelectedAgentId(null);
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const filteredAgents = allAgents.filter((agent) =>
    agent.role === Role.AGENT &&
    (agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     agent.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-agent-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 id="assign-agent-title" className="text-xl font-bold text-navy dark:text-white font-playfair">
              Assign Agent
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Assigning agent for {requestName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assign agent modal"
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:text-white"
            />
          </div>

          {/* Agent List */}
          <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-lg mb-4">
            {agentsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy dark:border-white mx-auto"></div>
              </div>
            ) : filteredAgents.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                      selectedAgentId === agent.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-navy dark:text-white">
                          {agent.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {agent.email}
                        </p>
                      </div>
                    </div>
                    {selectedAgentId === agent.id && (
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No agents found matching your search.
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={() => selectedAgentId && onConfirm(selectedAgentId)}
            disabled={!selectedAgentId || isSubmitting}
            className="px-6 py-2 bg-navy dark:bg-slate-200 text-white dark:text-navy font-medium rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              'Confirm Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
