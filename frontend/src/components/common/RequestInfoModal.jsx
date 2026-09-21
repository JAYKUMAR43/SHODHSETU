import React, { useState } from 'react';
import { HelpCircle, Clock, Send, Sparkles, AlertCircle } from 'lucide-react';
import BottomSheet from './BottomSheet';

const QUICK_CHIPS = [
  "Exact GPS coordinates / nearby landmark required",
  "Evidence photo of the current operational defect",
  "Panchayat / PRI local nodal representative contact",
  "Water sample test report or TDS reading",
  "Seasonality / exact frequency of breakdown"
];

export const RequestInfoModal = ({
  isOpen,
  onClose,
  challenge,
  onSubmit,
  isSubmitting = false
}) => {
  const [question, setQuestion] = useState('');

  if (!challenge) return null;

  const handleChipClick = (chip) => {
    if (question.trim()) {
      setQuestion(prev => `${prev}\n• ${chip}`);
    } else {
      setQuestion(`• ${chip}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    onSubmit(challenge.id, question.trim());
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Request Additional Information"
      subtitle={`Challenge ${challenge.tracking_id} — ${challenge.title}`}
      badge="District STI Validation"
      icon={HelpCircle}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plain Language SLA Pause Explanation (Fix 0B / Fix 0C) */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-purple-900">
          <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">48-Hour SLA Review Clock Pauses:</span>
            <p className="text-purple-800 leading-relaxed">
              This pauses the 48-hour review clock until the submitter responds. Once the citizen or local representative submits the requested clarification, the challenge will automatically resume in your validation queue.
            </p>
          </div>
        </div>

        {/* Quick Directive Chips */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
            Quick Directive Chips (Click to append):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal/20 text-slate-700 hover:text-navy border border-slate-200 transition-colors text-left"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Question Textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-navy uppercase tracking-wider">
            Clarification Question for Submitter *
          </label>
          <textarea
            required
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Specify clearly what additional details, landmarks, or photos are needed to validate this challenge..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent resize-none leading-relaxed"
          />
          <span className="text-[10px] text-slate-400 block">
            Sent directly to the citizen via portal notification and SMS.
          </span>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !question.trim()}
            className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Request & Pause SLA'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default RequestInfoModal;
