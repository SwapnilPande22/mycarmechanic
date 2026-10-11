// Optional result fields live inside inspections.result; historical results need no migration.
export const inspectionVersion = "inspection-cheapest-v3";
export const recheckVersion = "inspection-cheapest-recheck-v3";
export const choiceVersion = "inspection-cheapest-choice-v3";
const fixes = ["refit", "reclip", "screw_back", "dent_pull", "touch_up", "repair", "repair_paint", "replacement"];
const breakages = ["broken", "cracked_through", "missing"];
export type Finding = {
  panel: string; status: string; confidence: string; reason: string;
  repairType: "repair" | "denting_painting" | "replacement" | "unclear";
  cheapestFix: string; replacementCondition: string; replacementEvidence: string; replacementReason: string;
};
export function normalizeFinding(panel: string, raw: any): Finding {
  let status = ["damaged", "not_damaged", "not_visible", "uncertain"].includes(raw?.status) ? raw.status : "not_visible";
  const confidence = ["high", "medium", "low"].includes(raw?.confidence) ? raw.confidence : "low";
  const reason = typeof raw?.reason === "string" ? raw.reason.trim().slice(0, 280) : "Not clearly visible in the supplied photo.";
  let cheapestFix = fixes.includes(raw?.cheapestFix) ? raw.cheapestFix : "check";
  const replacementEvidence = breakages.includes(raw?.replacementEvidence) ? raw.replacementEvidence : "none";
  const replacementReason = typeof raw?.replacementReason === "string" ? raw.replacementReason.trim().slice(0, 280) : "";
  // A loose mounting, a reflection, or an uncertain claim cannot authorize replacement.
  if (status === "damaged" && (confidence === "low" || typeof raw?.reason !== "string" || !raw.reason.trim() || cheapestFix === "check" ||
      (cheapestFix === "replacement" && (confidence !== "high" || replacementEvidence === "none" || !replacementReason)))) status = "uncertain";
  if (status !== "damaged") cheapestFix = "check";
  const repairType = cheapestFix === "replacement" ? "replacement" : ["touch_up", "repair_paint"].includes(cheapestFix) ? "denting_painting" : cheapestFix === "check" ? "unclear" : "repair";
  return {panel, status, confidence, reason, repairType, cheapestFix, replacementEvidence, replacementReason,
    replacementCondition: typeof raw?.replacementCondition === "string" && raw.replacementCondition.trim()
      ? raw.replacementCondition.trim().slice(0, 280)
      : "the part itself is broken beyond safe repair, cracked through or missing"};
}
export function mergeFindings(panelIds: readonly string[], photos: Array<{checklist: Finding[]}>) {
  const rank = (finding: Finding) => ["high", "medium", "low"].indexOf(finding.confidence);
  // Proven shell breakage takes precedence; otherwise secure a visibly loose intact
  // part before cosmetic work. A scuff-only view must not override a mounting view.
  const jobRank = (finding: Finding) => finding.cheapestFix === "replacement" ? 0 :
    ["refit", "reclip", "screw_back"].includes(finding.cheapestFix) ? 1 : 2;
  const merged = panelIds.map(panel => {
    const evidence = photos.flatMap(photo => photo.checklist.filter(item => item.panel === panel));
    const confirmed = evidence.filter(item => item.status === "damaged").sort((a, b) => jobRank(a) - jobRank(b) || rank(a) - rank(b));
    if (confirmed.length) return confirmed[0];
    const visible = evidence.filter(item => item.status !== "not_visible").sort((a, b) => rank(a) - rank(b) ||
      Number(b.status === "not_damaged") - Number(a.status === "not_damaged"));
    return visible[0] || normalizeFinding(panel, null);
  });
  return {
    panels: merged.filter(item => item.status === "damaged").map(item => ({...item, needsAnotherPhoto:false})),
    checks: merged.filter(item => item.status === "uncertain").map(item => ({...item, needsAnotherPhoto:true})),
  };
}
export function pricingItemsFor(items: Array<{panel:string; repairType:string; cheapestFix?:string; reason?:string}>) {
  return items.filter(item => item.repairType !== "unclear" && item.cheapestFix !== "check").flatMap(item => {
    const cheapest = {panel:item.panel, repairType:item.repairType as "repair" | "denting_painting" | "replacement", ...(item.cheapestFix ? {cheapestFix:item.cheapestFix} : {}), ...(item.reason ? {reason:item.reason} : {})};
    return item.cheapestFix && item.repairType !== "replacement"
      ? [cheapest, {...cheapest, repairType:"replacement" as const, cheapestFix:"replacement"}]
      : [cheapest];
  });
}
