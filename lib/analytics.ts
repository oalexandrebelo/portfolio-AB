type GAParams = Record<string, string | number | boolean | undefined>;

/**
 * Low-level GA4 event sender. Call only from client-side handlers.
 * Pushes straight to the gtag function defined by the @next/third-parties
 * GoogleAnalytics component — avoids the module-state coupling of sendGAEvent
 * (which can silently no-op on the client). Never throws.
 */
export function trackEvent(name: string, params: GAParams = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  try {
    if (typeof w.gtag === "function") {
      w.gtag("event", name, params);
    } else {
      (w.dataLayer = w.dataLayer || []).push(["event", name, params]);
    }
  } catch {
    /* no-op */
  }
}

/** GA4 recommended event — lead generation (WhatsApp / e-mail). Mark as conversion in GA4. */
export function trackLead(method: "whatsapp" | "email", location: string) {
  trackEvent("generate_lead", { method, cta_location: location });
}

/** GA4 recommended event — content selection (portfolio card, CTA, article). */
export function trackSelectContent(
  contentType: string,
  itemId: string,
  extra: GAParams = {}
) {
  trackEvent("select_content", {
    content_type: contentType,
    item_id: itemId,
    ...extra,
  });
}

/** Outbound link click (social, external project). */
export function trackOutbound(url: string, location: string) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    /* ignore malformed URL */
  }
  trackEvent("click", {
    link_url: url,
    link_domain: domain,
    outbound: true,
    cta_location: location,
  });
}
