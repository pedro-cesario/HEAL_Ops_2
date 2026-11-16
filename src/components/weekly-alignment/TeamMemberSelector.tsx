import React from 'react';

export interface CollaboratorOption {
  id: string;
  name: string;
  role: string;
  macroArea: string;
}

export const TeamMemberSelector: React.FC<{
  label: string;
  value: string;
  options: CollaboratorOption[];
  emptyOptionLabel?: string;
  required?: boolean;
  onChange: (selectedId: string, selectedName: string) => void;
}> = ({
  label,
  value,
  options,
  emptyOptionLabel = 'Não definido',
  required = false,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(e) => {
          const id = e.target.value;
          const found = options.find((o) => o.id === id);
          onChange(id, found ? found.name : '');
        }}
        className="w-full rounded-md border border-slate-200 dark:border-[#243242] bg-slate-50 dark:bg-[#18222F] px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0F5E59] dark:focus:border-[#2DD4BF]"
      >
        <option value="">{emptyOptionLabel}</option>
        {options.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} · {member.macroArea}
          </option>
        ))}
      </select>
    </div>
  );
};
