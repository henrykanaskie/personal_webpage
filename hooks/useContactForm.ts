"use client";

import { useRef, useState } from "react";
import { EMPTY_CONTACT, validateContact, type ContactErrors, type ContactField } from "@/lib/contact";

type ContactStatus = "idle" | "sending" | "sent" | "error";

/**
 * State and submission for a contact form posting to /api/contact. The route
 * drops anything that fills the honeypot or arrives within two seconds of the
 * form opening, so call `begin` whenever the form is (re)opened.
 */
export function useContactForm() {
  const [values, setValues] = useState(EMPTY_CONTACT);
  const [honeypot, setHoneypot] = useState("");
  const openedAt = useRef(Date.now());
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactErrors>({});
  const [focused, setFocused] = useState<ContactField | null>(null);

  const update = (field: ContactField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((fe) => {
        const n = { ...fe };
        delete n[field];
        return n;
      });
  };

  const begin = () => {
    setStatus("idle");
    openedAt.current = Date.now();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateContact(values);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot, formOpenedAt: openedAt.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Failed to send.");
        return;
      }
      setStatus("sent");
      setValues(EMPTY_CONTACT);
    } catch {
      setStatus("error");
      setError("Something went wrong.");
    }
  };

  // Visually hidden: bots fill it, people never see it.
  const honeypotProps = {
    type: "text",
    name: "website",
    value: honeypot,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value),
    tabIndex: -1,
    "aria-hidden": true,
    autoComplete: "off",
    style: { position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" },
  } as const;

  const focusProps = (field: ContactField) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused(null),
  });

  return { values, update, status, setStatus, error, fieldErrors, focused, focusProps, honeypotProps, begin, submit };
}
