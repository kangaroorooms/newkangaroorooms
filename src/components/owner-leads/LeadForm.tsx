import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  CircleCheckBig,
  Sparkles,
  User,
  Phone as PhoneIcon,
  MapPin,
  FileText,
  NotebookPen,
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { FormGrid } from "../ui/FormGrid";
import { CitySelector } from "../CitySelector";
import { PhoneInput } from "../ui/PhoneInput";
import SearchableSelectInput from "../SearchableSelectInput";
import { OwnerLeadFormInput } from "../../types/ownerLead.types";
import { FORM_STYLES } from "../../constants/designSystem";
import { OWNER_LEAD_SOURCE_OPTIONS } from "../../constants/ownerLead";
import { validateIndianPhone } from "../../utils/phoneValidation";

interface LeadFormProps {
  isAdmin?: boolean;
  isLoading?: boolean;
  onSubmit: (payload: OwnerLeadFormInput) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyForm: OwnerLeadFormInput = {
  ownerName: "",
  phone: "",
  alternatePhone: "",
  city: "",
  locality: "",
  address: "",
  landmark: "",
  leadSource: "",
  notes: "",
  assignedAgentId: null,
};

const inputClass = FORM_STYLES.input;
const textareaClass = `${FORM_STYLES.input} min-h-[128px] resize-none`;
const labelClass = FORM_STYLES.label;

const validateField = (
  field: keyof OwnerLeadFormInput,
  value: string,
): string => {
  switch (field) {
    case "ownerName":
      if (!value.trim()) return "Owner name is required";
      if (value.trim().length < 2) return "Please enter at least 2 characters";
      return "";
    case "phone": {
      const error = validateIndianPhone(value);
      return error || "";
    }
    case "alternatePhone": {
      if (!value.trim()) return "";
      const error = validateIndianPhone(value);
      return error || "";
    }
    case "city":
      return value.trim() ? "" : "City is required";
    case "leadSource":
      return value.trim() ? "" : "Lead source is required";
    default:
      return "";
  }
};

export function LeadForm({
  isAdmin = false,
  isLoading = false,
  onSubmit,
  onCancel,
}: LeadFormProps) {
  const [form, setForm] = useState<OwnerLeadFormInput>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof OwnerLeadFormInput, string>>
  >({});
  const [step, setStep] = useState<"essential" | "details">("essential");
  const [showAllErrors, setShowAllErrors] = useState(false);

  const updateField = (field: keyof OwnerLeadFormInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof OwnerLeadFormInput, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const validateEssential = () => {
    const nextErrors: Partial<Record<keyof OwnerLeadFormInput, string>> = {};

    (
      ["ownerName", "phone", "city", "leadSource"] as Array<
        keyof OwnerLeadFormInput
      >
    ).forEach((field) => {
      const error = validateField(field, form[field] || "");
      if (error) nextErrors[field] = error;
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof OwnerLeadFormInput, string>> = {};

    (
      ["ownerName", "phone", "alternatePhone", "city", "leadSource"] as Array<
        keyof OwnerLeadFormInput
      >
    ).forEach((field) => {
      const error = validateField(field, form[field] || "");
      if (error) nextErrors[field] = error;
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (event?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!validateEssential()) return;
    setStep("details");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== "details") return;
    if (!validateForm()) return;

    try {
      await onSubmit({
        ...form,
        assignedAgentId: form.assignedAgentId || null,
      });
      setForm(emptyForm);
      setErrors({});
    } catch {
      // Keep the form intact so callers can show error state if needed
    }
  };

  const summary = useMemo(() => {
    const parts = [form.ownerName, form.city, form.leadSource].filter(Boolean);
    return parts.length ? parts.join(" • ") : "New owner lead";
  }, [form.city, form.leadSource, form.ownerName]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-col h-full w-full bg-white dark:bg-slate-800"
      noValidate
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              CRM Capture
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {step === "essential" ? "New Owner Lead" : "Lead Details"}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {step === "essential"
                ? "Capture essential information. Additional details can be added next."
                : "Add context to help your team with follow-ups."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {step === "essential" ? (
          <div className="mx-auto max-w-3xl space-y-5 sm:space-y-8">
            {/* Lead Information Section */}
            <section>
              <div className="mb-4 flex items-center gap-3 sm:mb-6">
                <div className="rounded-xl bg-amber-100 dark:bg-amber-500/20 p-2.5">
                  <User className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Owner Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">All fields marked * are required</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 p-4 sm:p-6">
                <FormGrid columns={{ md: 2 }} gap="comfortable">
                <div>
                  <label htmlFor="owner-name" className={labelClass}>
                    Owner name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    autoFocus
                    maxLength={80}
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    onBlur={(e) => handleBlur("ownerName", e.target.value)}
                    placeholder="Full name"
                    className={`${inputClass} ${
                      errors.ownerName
                        ? "border-red-400 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/30"
                        : ""
                    }`}
                    aria-invalid={Boolean(errors.ownerName)}
                    aria-describedby={
                      errors.ownerName ? "owner-name-error" : undefined
                    }
                  />
                  {errors.ownerName && (
                    <p
                      id="owner-name-error"
                      className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
                    >
                      {errors.ownerName}
                    </p>
                  )}
                  {!errors.ownerName && <div className="mt-2 h-5" />}
                </div>

                <PhoneInput
                  id="owner-phone"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                  onBlur={(value) => handleBlur("phone", value)}
                  placeholder="9876543210"
                  label="Phone"
                  required
                  error={errors.phone}
                  ariaDescribedBy="owner-phone-error"
                />

                <div>
                  <label htmlFor="owner-city" className={labelClass}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <CitySelector
                    id="owner-city"
                    value={form.city}
                    onChange={(value) => updateField("city", value)}
                    error={errors.city}
                    placeholder="Search city"
                  />
                </div>

                <div>
                  <label htmlFor="owner-lead-source" className={labelClass}>
                    Lead source <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelectInput
                    id="owner-lead-source"
                    value={form.leadSource}
                    onChange={(value) => updateField("leadSource", value)}
                    options={OWNER_LEAD_SOURCE_OPTIONS}
                    placeholder="Select a lead source"
                    inputClassName={`${inputClass} ${
                      errors.leadSource
                        ? "border-red-400 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/30"
                        : ""
                    }`}
                    dropdownClassName="max-h-72"
                  />
                  {errors.leadSource && (
                    <p
                      id="owner-lead-source-error"
                      className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
                    >
                      {errors.leadSource}
                    </p>
                  )}
                  {!errors.leadSource && <div className="mt-2 h-5" />}
                </div>
              </FormGrid>
            </div>
            </section>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 sm:space-y-8">
            {/* Optional Details Section */}
            <section>
              <div className="mb-4 flex items-center gap-3 sm:mb-6">
                <div className="rounded-xl bg-slate-100 dark:bg-slate-700 p-2.5">
                  <NotebookPen className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Optional Details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add context for your team</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 p-4 sm:p-6">
                <FormGrid columns={{ md: 2 }} gap="comfortable">
                <div>
                  <label htmlFor="owner-locality" className={labelClass}>
                    Locality
                  </label>
                  <input
                    id="owner-locality"
                    type="text"
                    maxLength={100}
                    value={form.locality ?? ""}
                    onChange={(e) => updateField("locality", e.target.value)}
                    placeholder="Locality"
                    className={inputClass}
                  />
                  <div className="mt-2 h-5" />
                </div>
                <div>
                  <label htmlFor="owner-address" className={labelClass}>
                    Address
                  </label>
                  <input
                    id="owner-address"
                    type="text"
                    maxLength={250}
                    value={form.address ?? ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Full address"
                    className={inputClass}
                  />
                  <div className="mt-2 h-5" />
                </div>
                <div>
                  <label htmlFor="owner-landmark" className={labelClass}>
                    Landmark
                  </label>
                  <input
                    id="owner-landmark"
                    type="text"
                    maxLength={100}
                    value={form.landmark ?? ""}
                    onChange={(e) => updateField("landmark", e.target.value)}
                    placeholder="Nearby landmark"
                    className={inputClass}
                  />
                  <div className="mt-2 h-5" />
                </div>
                <PhoneInput
                  id="owner-alternate-phone"
                  value={form.alternatePhone ?? ""}
                  onChange={(value) => updateField("alternatePhone", value)}
                  onBlur={(value) => handleBlur("alternatePhone", value)}
                  placeholder="Optional backup (10 digits)"
                  label="Alternate phone"
                  error={errors.alternatePhone}
                  ariaDescribedBy="owner-alternate-phone-error"
                />
                <div className="md:col-span-2">
                  <label htmlFor="owner-notes" className={labelClass}>
                    Notes
                  </label>
                  <textarea
                    id="owner-notes"
                    maxLength={500}
                    value={form.notes ?? ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Add any context for the team"
                    className={textareaClass}
                    rows={4}
                  />
                  <div className="mt-2 h-5" />
                </div>
              </FormGrid>
            </div>
            </section>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-800/90">
        <div className="mx-auto flex max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="font-semibold">{step === "essential" ? "Step 1 of 2" : "Step 2 of 2"}</span> • {step === "essential" ? "Basic Information" : "Additional Details"}
          </div>
          <div className="flex w-full gap-2.5 sm:w-auto sm:gap-4">
            {step === "details" ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep("essential")}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => onCancel?.()}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
            {step === "essential" ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={(event) => handleNext(event)}
                className="flex-1 sm:flex-none"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? "Creating..." : "Create Lead"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
