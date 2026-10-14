import { STATUSES } from '../constants';
import { Check } from 'lucide-react';

export default function StatusStepper({ status }) {
  const stage = ['ai_verified', 'assigned', 'in_progress'].includes(status)
    ? 'in_progress'
    : ['resolved', 'citizen_verified'].includes(status)
      ? 'resolved'
      : 'submitted';
  const currentIdx = STATUSES.findIndex(([k]) => k === stage);
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="w-full py-2">
      <ol className="flex items-center justify-between w-full relative">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
        <div
          className="absolute left-6 top-4 -translate-y-1/2 h-1 bg-[#0066FF] transition-all duration-500 -z-0"
          style={{
            width: `${(activeIndex / (STATUSES.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 3rem)',
          }}
        />

        {STATUSES.map(([k, label], i) => {
          const isCompleted = i < activeIndex;
          const isCurrent = i === activeIndex;

          return (
            <li key={k} className="flex flex-col items-center relative z-10">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-[#0066FF] text-white'
                    : isCurrent
                    ? 'bg-[#0066FF] text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
              </span>
              <span
                className={`mt-2 text-xs text-center font-medium transition-colors ${
                  isCurrent ? 'font-bold text-[#0066FF]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
