"use client";

import Modal, { CloseButton } from "./Modal";
import type { useContactForm } from "@/hooks/useContactForm";
import type { ContactField } from "@/lib/contact";

const FIELDS: { field: ContactField; label: string; capitalize: boolean }[] = [
  { field: "name", label: "name", capitalize: true },
  { field: "email", label: "email", capitalize: true },
  { field: "subject", label: "subject", capitalize: true },
  { field: "message", label: "Message", capitalize: false },
];

export default function ContactModal({
  isDark,
  form,
  onClose,
}: {
  isDark: boolean;
  form: ReturnType<typeof useContactForm>;
  onClose: () => void;
}) {
  const { values, update, status, error, fieldErrors, focused, focusProps, honeypotProps, submit } = form;

  const fieldStyle = (field: ContactField): React.CSSProperties => ({
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    color: isDark ? "rgba(255,255,255,0.88)" : "rgba(20,28,48,0.75)",
    fontSize: "0.95rem",
    border: fieldErrors[field]
      ? `1px solid ${isDark ? "rgba(255,130,130,0.4)" : "rgba(200,60,60,0.3)"}`
      : focused === field
        ? `1px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(20,28,48,0.25)"}`
        : undefined,
  });

  return (
    <Modal isDark={isDark} onClose={onClose} className="max-w-lg">
      <div className="relative z-[1] flex justify-between items-center p-6 pb-0">
        <span className="relative inline-block">
          <span
            style={{
              color: isDark ? "rgba(255,255,255,0.88)" : "rgba(20,28,48,0.82)",
              fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
              fontWeight: 700,
            }}
          >
            Send a Message
          </span>
        </span>
        <CloseButton onClick={onClose} />
      </div>
      <form onSubmit={submit} noValidate className="relative z-[1] p-6 flex flex-col gap-4">
        <input {...honeypotProps} />
        {FIELDS.map(({ field, label, capitalize }) => (
          <div key={field}>
            <span className="relative inline-block">
              <label
                className="block mb-1.5"
                style={{
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(20,28,48,0.5)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: capitalize ? "capitalize" : undefined,
                }}
              >
                {label}
              </label>
            </span>
            {field === "message" ? (
              <textarea
                rows={5}
                value={values.message}
                onChange={(e) => update("message", e.target.value)}
                {...focusProps("message")}
                className="w-full rounded-xl px-4 py-2.5 outline-none transition-colors resize-none glass-panel"
                style={fieldStyle("message")}
              />
            ) : (
              <input
                type={field === "email" ? "email" : "text"}
                value={values[field]}
                onChange={(e) => update(field, e.target.value)}
                {...focusProps(field)}
                className="w-full rounded-xl px-4 py-2.5 outline-none transition-colors glass-panel"
                style={fieldStyle(field)}
              />
            )}
            {fieldErrors[field] && (
              <p
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: isDark
                    ? "linear-gradient(135deg, rgb(255,150,150), rgb(255,130,160))"
                    : "linear-gradient(135deg, rgb(190,60,60), rgb(170,50,80))",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  marginTop: 4,
                  marginBottom: 0,
                }}
              >
                {fieldErrors[field]}
              </p>
            )}
          </div>
        ))}
        {status === "error" && <p style={{ color: "rgb(255,120,120)", fontSize: "0.85rem" }}>{error}</p>}
        {status === "sent" ? (
          <span className="relative inline-block">
            <p
              className="text-center py-2 bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundImage: isDark
                  ? "linear-gradient(135deg, rgb(160,230,190), rgb(180,210,200))"
                  : "linear-gradient(135deg, rgb(60,130,80), rgb(80,140,100))",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            >
              Message sent successfully!
            </p>
          </span>
        ) : (
          <button
            type="submit"
            disabled={status === "sending"}
            className="metal-surface mt-2 w-full py-3 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>{status === "sending" ? "Sending..." : "Send"}</span>
          </button>
        )}
      </form>
    </Modal>
  );
}
