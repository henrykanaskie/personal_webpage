"use client";

import { useEffect, useState } from "react";
import { useIsDark } from "@/lib/glass";
import { feedbackEnabled, onFeedbackChange, setFeedbackEnabled } from "./feedback";
import { photoTheme } from "./utils";

/** Opt-in for shutter sounds and haptics, sized to sit in the photography nav bar. */
export default function FeedbackToggle({ isDark: isDarkProp }: { isDark?: boolean }) {
  const detected = useIsDark();
  const isDark = isDarkProp ?? detected;
  const t = photoTheme(isDark);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(feedbackEnabled());
    return onFeedbackChange(setOn);
  }, []);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? "Turn off shutter sounds" : "Turn on shutter sounds"}
        onClick={() => setFeedbackEnabled(!on)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${t.rule}`,
          background: t.glass,
          backdropFilter: "blur(14px) saturate(1.4)",
          WebkitBackdropFilter: "blur(14px) saturate(1.4)",
          color: on ? t.accent : t.sub,
          cursor: "pointer",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" fillOpacity={on ? 0.25 : 0} />
          {on ? (
            <>
              <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
              <path d="M18.5 7a7 7 0 0 1 0 10" />
            </>
          ) : (
            <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
          )}
        </svg>
      </button>
    </div>
  );
}
