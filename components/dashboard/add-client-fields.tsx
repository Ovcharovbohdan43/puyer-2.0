"use client";

type AddClientFieldsProps = {
  name: string;
  email: string;
  phone: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onPhone: (value: string) => void;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-[#E5E7EB] px-3 text-[16px] text-[#111827] placeholder:text-[#9CA3AF]";

export function AddClientFields({
  name,
  email,
  phone,
  namePlaceholder,
  emailPlaceholder,
  phonePlaceholder,
  onName,
  onEmail,
  onPhone,
}: AddClientFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(event) => onName(event.target.value)}
        placeholder={namePlaceholder}
        autoComplete="organization"
        className={fieldClass}
      />
      <input
        type="email"
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        placeholder={emailPlaceholder}
        autoComplete="email"
        required
        className={fieldClass}
      />
      <input
        type="tel"
        value={phone}
        onChange={(event) => onPhone(event.target.value)}
        placeholder={phonePlaceholder}
        autoComplete="tel"
        className={fieldClass}
      />
    </div>
  );
}
