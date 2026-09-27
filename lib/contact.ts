// ─── Contact form ───────────────────────────────────────────────────────────
// Shared by both contact forms (the CS page's modal and the photography About
// page) and by the /api/contact route that receives them.

export const CONTACT_FIELDS = ["name", "email", "subject", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const EMPTY_CONTACT: ContactValues = { name: "", email: "", subject: "", message: "" };

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function validateContact(values: ContactValues): ContactErrors {
  const errs: ContactErrors = {};
  if (!values.name.trim()) errs.name = "Name is required";
  if (!values.email.trim()) errs.email = "Email is required";
  else if (!isEmail(values.email)) errs.email = "Enter a valid email";
  if (!values.subject.trim()) errs.subject = "Subject is required";
  if (!values.message.trim()) errs.message = "Message is required";
  return errs;
}
