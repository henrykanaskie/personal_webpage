"use client";

import Modal, { CloseButton } from "./Modal";
import { LINKS } from "@/lib/site";

export default function ResumeModal({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  return (
    <Modal isDark={isDark} onClose={onClose} className="max-w-3xl">
      <div className="sticky top-0 z-10 flex justify-between items-center p-4">
        <a href={LINKS.resumePdf} download className="metal-surface flex items-center gap-2 px-4 py-2 rounded-full">
          <span
            className="flex items-center gap-2 bg-clip-text text-transparent"
            style={{
              WebkitBackgroundClip: "text",
              backgroundImage: "var(--title-fill)",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </span>
        </a>
        <CloseButton onClick={onClose} />
      </div>
      <div className="p-6 pt-0 relative z-[1]">
        <div className="w-full rounded-lg" style={{ height: "80vh", overflow: "hidden", position: "relative" }}>
          <iframe
            src={`${LINKS.resumePdf}#toolbar=0&navpanes=0`}
            style={{
              border: "none",
              outline: "none",
              position: "absolute",
              top: "-4px",
              left: "-4px",
              width: "calc(100% + 8px)",
              height: "calc(100% + 8px)",
              colorScheme: "light",
            }}
            title="Resume"
          />
        </div>
      </div>
    </Modal>
  );
}
