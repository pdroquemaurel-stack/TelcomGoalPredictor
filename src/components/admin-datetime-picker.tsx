'use client';

import { useRef } from 'react';

type Props = {
  name: string;
  required?: boolean;
  defaultValue?: string;
};

export function AdminDateTimePicker({ name, required, defaultValue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        className="w-full rounded border p-2"
        defaultValue={defaultValue}
        name={name}
        onFocus={(event) => event.currentTarget.showPicker?.()}
        required={required}
        step={60}
        type="datetime-local"
      />
      <button
        className="rounded border px-3 text-xs font-semibold"
        onClick={() => inputRef.current?.showPicker?.()}
        type="button"
      >
        📅
      </button>
    </div>
  );
}
