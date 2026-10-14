import { useEffect, useRef, useState } from "react";
import { isValidMonthValue } from "../lib/input-security";

const MONTH_OPTIONS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
] as const;

function splitMonthValue(value: string): { year: string; month: string } {
  if (!isValidMonthValue(value)) return { year: "", month: "" };
  const [year, month] = value.split("-");
  return { year, month };
}

type MonthYearFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

export function MonthYearField({
  id,
  value,
  onChange,
  disabled = false,
  invalid = false,
  className = "",
}: MonthYearFieldProps) {
  const yearRef = useRef<HTMLInputElement | null>(null);
  const editingRef = useRef(false);
  const parsed = splitMonthValue(value);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    if (editingRef.current) return;
    if (isValidMonthValue(value)) {
      const next = splitMonthValue(value);
      setMonth(next.month);
      setYear(next.year);
      return;
    }
    if (value === "") {
      setMonth("");
      setYear("");
    }
  }, [value]);

  const commit = (nextMonth: string, nextYear: string) => {
    if (nextMonth && /^\d{4}$/.test(nextYear)) {
      onChange(`${nextYear}-${nextMonth}`);
      return;
    }
    onChange("");
  };

  const markEditing = () => {
    editingRef.current = true;
  };

  const endEditing = () => {
    editingRef.current = false;
  };

  const inputClass = `${className}${invalid ? " is-invalid" : ""}`.trim();

  return (
    <div className="wp-month-year" style={{ display: "grid", gridTemplateColumns: "minmax(9.5rem, 1fr) 5.5rem", gap: "0.5rem", width: "100%" }}>
      <select
        id={id}
        className={`wp-select ${inputClass}`.trim()}
        value={month}
        disabled={disabled}
        style={{ minWidth: 0, width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}
        onFocus={markEditing}
        onBlur={endEditing}
        onChange={(event) => {
          const nextMonth = event.target.value;
          setMonth(nextMonth);
          commit(nextMonth, year);
          requestAnimationFrame(() => {
            yearRef.current?.focus();
            yearRef.current?.select();
          });
        }}
      >
        <option value="">Mês</option>
        {MONTH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        ref={yearRef}
        id={`${id}-ano`}
        className={`wp-input ${inputClass}`.trim()}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Ano"
        maxLength={4}
        value={year}
        disabled={disabled}
        aria-label="Ano"
        style={{ width: "5.5rem", minWidth: "5.5rem", maxWidth: "5.5rem", textAlign: "center" }}
        onFocus={markEditing}
        onBlur={endEditing}
        onChange={(event) => {
          const nextYear = event.target.value.replace(/\D/g, "").slice(0, 4);
          setYear(nextYear);
          commit(month, nextYear);
        }}
      />
    </div>
  );
}
