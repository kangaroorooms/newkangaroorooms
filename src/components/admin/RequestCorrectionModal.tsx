import React, { useState } from 'react';
import { X, AlertCircle, Send } from 'lucide-react';
import { FeedbackReason, FeedbackSeverity } from '../../src/types/api.types';
interface RequestCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: FeedbackReason, message: string, severity?: FeedbackSeverity) => void;
  propertyTitle: string;
}
const REASON_OPTIONS: {
  value: FeedbackReason;
  label: string;
  description: string;
}[] = [{
  value: 'wrong_price',
  label: 'Wrong Price',
  description: 'Listed price does not match market rate or actual rent'
}, {
  value: 'fake_images',
  label: 'Fake / Misleading Images',
  description: 'Images do not match the actual property'
}, {
  value: 'wrong_address',
  label: 'Wrong Address or Location',
  description: 'Location information is incorrect or misleading'
}, {
  value: 'missing_amenities',
  label: 'Missing Amenities',
  description: 'Important amenities or details are not listed'
}, {
  value: 'duplicate_listing',
  label: 'Duplicate Listing',
  description: 'This property is already listed'
}, {
  value: 'policy_violation',
  label: 'Policy Violation',
  description: 'Violates platform terms or policies'
}, {
  value: 'other',
  label: 'Other',
  description: 'Other issues requiring correction'
}];
export function RequestCorrectionModal({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle
}: RequestCorrectionModalProps) {
  const [reason, setReason] = useState<FeedbackReason>('fake_images');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<FeedbackSeverity>('minor');
  if (!isOpen) return null;
  const handleSubmit = () => {
    if (message.trim()) {
      onConfirm(reason, message.trim(), severity);
      // Reset form
      setReason('fake_images');
      setMessage('');
      setSeverity('minor');
      onClose();
    }
  };
  const selectedReason = REASON_OPTIONS.find((opt) => opt.value === reason);
  return <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
          <div>
            <h3 className="text-xl font-bold text-navy dark:text-white font-playfair">
              Request Correction
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Send feedback to property owner
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">

            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Property Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Property
            </p>
            <p className="font-bold text-navy dark:text-white">
              {propertyTitle}
            </p>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {REASON_OPTIONS.map((option) => <button key={option.value} onClick={() => setReason(option.value)} className={`text-left p-4 rounded-xl border-2 transition-all ${reason === option.value ? 'border-navy dark:border-white bg-navy/5 dark:bg-white/10 text-navy dark:text-white' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>

                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {option.description}
                  </div>
                </button>)}
            </div>
          </div>

          {/* Feedback Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feedback Message <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Be clear and specific about what needs to be corrected. This
              message will be sent directly to the property owner.
            </p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none min-h-[140px] resize-none dark:bg-slate-700 dark:text-white" placeholder="Example: The uploaded images do not match the actual room. Please upload real images showing the bedroom, washroom, and entrance area." />


            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {message.length} characters
              </p>
              {message.length < 20 && message.length > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">
                  Please provide more details (min 20 characters)
                </p>}
            </div>
          </div>

          {/* Severity Flag */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Issue Severity
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSeverity('minor')} className={`p-4 rounded-xl border-2 transition-all ${severity === 'minor' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 text-slate-700 dark:text-slate-300'}`}>

                <div className="font-medium">Minor Issue</div>
                <div className="text-xs mt-1 opacity-75">Quick fix needed</div>
              </button>
              <button onClick={() => setSeverity('major')} className={`p-4 rounded-xl border-2 transition-all ${severity === 'major' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 text-slate-700 dark:text-slate-300'}`}>

                <div className="font-medium">Major Issue</div>
                <div className="text-xs mt-1 opacity-75">
                  Significant changes required
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                <li>• Property status will change to "Needs Correction"</li>
                <li>• Owner will receive your feedback message</li>
                <li>• Property will be hidden from users until corrected</li>
                <li>• Owner can resubmit after making changes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">

            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!message.trim() || message.length < 20} className="flex items-center gap-2 px-6 py-2.5 bg-navy dark:bg-slate-200 text-white dark:text-navy font-medium rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

            <Send className="w-4 h-4" />
            Send Feedback
          </button>
        </div>
      </div>
    </div>;
}