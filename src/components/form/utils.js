export const STATIC_OPTIONS = {
    departments: ["Research", "Operations", "QA", "Sales", "Support", "Engineering"],
    categories: ["New Request", "Update Existing", "Issue Report", "Billing", "Other"],
    priorities: ["Low", "Medium", "High", "Urgent"],
    contactMethods: ["Email", "Phone", "WhatsApp", "Slack"],
  };
  
  export function cn(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  
  export function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }
  
  export function normalizePhone(v) {
    // Simple “development phase” normalize:
    // keep digits + leading +
    const s = String(v || "").trim();
    const cleaned = s.replace(/[^\d+]/g, "");
    return cleaned.startsWith("+") ? cleaned : cleaned;
  }
  