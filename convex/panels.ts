import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS = 8;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const panels = ["front_bumper", "rear_bumper", "bonnet", "boot", "front_lhs_door", "front_rhs_door", "rear_lhs_door", "rear_rhs_door", "lhs_fender", "rhs_fender", "lhs_quarter_panel", "rhs_quarter_panel", "lhs_mirror", "rhs_mirror", "lhs_headlight", "rhs_headlight", "lhs_tail_light", "rhs_tail_light", "lhs_fog_light", "rhs_fog_light", "windshield"] as const;
const repairTypes = ["denting_painting", "repair", "replacement", "unclear"] as const;
const panelStatuses = ["damaged", "not_damaged", "not_visible"] as const;
const confidenceLevels = ["high", "medium", "low"] as const;
const alwaysReplace = (panel: string) => panel.includes("mirror") || panel.includes("headlight") || panel.includes("tail_light") || panel.includes("fog_light") || panel === "windshield";

export const analyzeDamage = action({
  args: {
    storageIds: v.array(v.id("_storage")),
    mimeTypes: v.array(v.string()),
    sizes: v.array(v.number()),
    dimensions: v.array(v.object({ width: v.number(), height: v.number() })),
    selectedModel: v.string(),
    variant: v.optional(v.string()),
    city: v.string(),
    carSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  },
  handler: async (ctx, { storageIds, mimeTypes, sizes, dimensions, selectedModel, variant, city, carSize }) => {
    if (storageIds.length < 1 || storageIds.length > MAX_PHOTOS || mimeTypes.length !== storageIds.length || sizes.length !== storageIds.length || dimensions.length !== storageIds.length) {
      throw new Error("Upload between 1 and 8 damage photos.");
    }
    if (!selectedModel.trim()) throw new Error("Choose a car model before inspecting photos.");
    for (let index = 0; index < storageIds.length; index += 1) {
      if (!allowedMimeTypes.includes(mimeTypes[index])) throw new Error("Upload JPG, PNG, or WebP photos.");
      if (sizes[index] <= 0 || sizes[index] > MAX_FILE_BYTES) throw new Error("Each photo must be smaller than 8 MB.");
      if (Math.max(dimensions[index].width, dimensions[index].height) < 1024) throw new Error("Each photo must be at least 1024 pixels on its long side.");
    }

    if (!city.trim()) throw new Error("Enter your city before inspecting photos.");
    let photosSentToAI = 0;
    try {
      // Hash the stored bytes, not model names, filenames, storage IDs or client claims.
      const files = await Promise.all(storageIds.map(async (id) => {
        const blob = await ctx.storage.get(id);
        if (!blob || !allowedMimeTypes.includes(blob.type) || blob.size > MAX_FILE_BYTES) throw new Error("A photo could not be read. Please upload it again.");
        const bytes = await blob.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const url = await ctx.storage.getUrl(id);
        if (!url) throw new Error("A photo could not be read. Please upload it again.");
        return { hash, url };
      }));
      files.sort((a, b) => a.hash.localeCompare(b.hash));
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(files.map((file) => file.hash))));
      const photoHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const cacheKey = JSON.stringify(["inspection-v2", photoHash, selectedModel.trim().toLowerCase(), city.trim().toLowerCase(), carSize]);
      const cached = await ctx.runQuery(internal.inspections.get, { cacheKey });
      if (cached) return cached;
      const allowed = await ctx.runMutation(internal.bills.consumeHourlyCall, {});
      if (!allowed) throw new Error("The hourly inspection limit has been reached. Please try again later.");
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("Photo inspection is not configured yet.");
      const imageUrls = files.map((file) => file.url);
      const photoFindings: Array<{ photoNumber: number; checklist: Array<{ panel: string; status: string; confidence: string; reason: string; repairType: string }>; damagedParts: Array<{ panel: string; confidence: string; reason: string; repairType: string }> }> = [];
      const modelFindings: Array<{ detectedModel: string | null; modelConfidence: string; modelMatchesSelected: string; modelReason: string; needsMorePhotos: boolean }> = [];
      for (let index = 0; index < imageUrls.length; index += 1) {
        photosSentToAI += 1;
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            temperature: 0,
            max_output_tokens: 2800,
            text: { format: { type: "json_object" } },
            input: [{ role: "user", content: [
              { type: "input_text", text: `First decide whether THIS image actually shows a real car or a car part, including a close-up of damage. Do not imagine car damage in unrelated images. Return isCarPhoto:false for non-car images and do not mark any part damaged. The selected model is context only, never evidence of damage. The owner selected car model: "${selectedModel}". This is photo ${index + 1} of ${imageUrls.length}; inspect THIS photo independently before considering any other image. Find every distinct damaged part visible here, including subtle secondary dents, scratches, cracks, broken or missing trim, and misalignment. Do not stop after the most obvious damage. Pay special attention to the view shown: rear or rear three-quarter views require careful checks of rear bumper, boot/tailgate, both tail lights and nearby bodywork; front or front three-quarter views require careful checks of front bumper, bonnet, both headlights, fog lights and nearby bodywork. Reflections, shadows, dirt and normal panel gaps are not damage. Do not infer a part is damaged without visible evidence. Return exactly one checklist entry for every panel below, in this order; mark not_visible if this single photo does not let you assess that part. Canonical ids: front_bumper, rear_bumper, bonnet, boot, front_lhs_door, front_rhs_door, rear_lhs_door, rear_rhs_door, lhs_fender, rhs_fender, lhs_quarter_panel, rhs_quarter_panel, lhs_mirror, rhs_mirror, lhs_headlight, rhs_headlight, lhs_tail_light, rhs_tail_light, lhs_fog_light, rhs_fog_light, windshield. Vehicle left/right means the car's own left/right when facing forward. Mark damaged, not_damaged or not_visible. Choose denting_painting for dents/scratches needing paint, repair for repairable damage without painting, replacement for irreparable/broken parts, or unclear for damaged parts; use unclear for other entries. Mirrors, headlights, tail lights and fog lights and glass must use replacement. Do not estimate prices. Identify the make/model only if visible evidence or badges support it. modelMatchesSelected is different only when this photo clearly shows a different model and modelConfidence is high; close-ups or unclear styling mean uncertain. Return JSON only: {"isCarPhoto":true|false,"detectedModel":"make and model or null","modelConfidence":"high|medium|low","modelMatchesSelected":"same|different|uncertain","modelReason":"brief visible evidence or why not identifiable","checklist":[{"panel":"canonical panel id","status":"damaged|not_damaged|not_visible","confidence":"high|medium|low","reason":"visual evidence or why not visible","repairType":"denting_painting|repair|replacement|unclear"}],"needsMorePhotos":true|false}. Include complete checklist even if no parts are damaged.` },
              { type: "input_image", image_url: imageUrls[index], detail: "high" },
            ] }],
          }),
        });
        if (!response.ok) throw new Error("Could not inspect these photos. Please try again.");
        const payload = await response.json();
        const responseText = payload.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === "output_text")?.text;
        if (!responseText) throw new Error("The photos could not be assessed. Please try clearer images.");
        let result: any;
        try { result = JSON.parse(responseText); } catch { throw new Error("The photos could not be assessed. Please try clearer images."); }
        if (result.isCarPhoto === false) {
          return await ctx.runMutation(internal.inspections.save, { cacheKey, photoHash, result: { photoHash, isCarPhoto:false, message:"This doesn't look like a photo of a car. Please upload a clear photo of the damage.", panels:[], estimates:[] } });
        }
        if (result.isCarPhoto !== true) throw new Error("The photos could not be assessed. Please try clearer images.");
        if (!Array.isArray(result.checklist)) throw new Error("The photos could not be assessed. Please try again.");
        const rawByPanel = new Map(result.checklist.map((item: any) => [item.panel, item]));
        const photoChecklist = panels.map((panel) => {
          const item: any = rawByPanel.get(panel);
          return {
            panel,
            status: item && panelStatuses.includes(item.status) ? item.status : "not_visible",
            confidence: item && confidenceLevels.includes(item.confidence) ? item.confidence : "low",
            reason: typeof item?.reason === "string" ? item.reason.slice(0, 180) : "Not clearly visible in this photo.",
            repairType: alwaysReplace(panel) ? "replacement" : item && repairTypes.includes(item.repairType) ? item.repairType : "unclear",
          };
        });
        const damagedParts = photoChecklist.filter((item) => item.status === "damaged").map(({ panel, confidence, reason, repairType }) => ({ panel, confidence, reason, repairType }));
        photoFindings.push({ photoNumber: index + 1, checklist: photoChecklist, damagedParts });
        const detectedModel = typeof result.detectedModel === "string" && result.detectedModel.trim() ? result.detectedModel.trim().slice(0, 80) : null;
        modelFindings.push({
          detectedModel,
          modelConfidence: confidenceLevels.includes(result.modelConfidence) ? result.modelConfidence : "low",
          modelMatchesSelected: ["same", "different", "uncertain"].includes(result.modelMatchesSelected) ? result.modelMatchesSelected : "uncertain",
          modelReason: typeof result.modelReason === "string" ? result.modelReason.slice(0, 180) : "The model could not be identified from this photo.",
          needsMorePhotos: result.needsMorePhotos === true,
        });
      }
      const cleanChecklist = panels.map((panel) => {
        const evidence = photoFindings.map((photo) => photo.checklist.find((item) => item.panel === panel)).filter(Boolean) as Array<{ panel: string; status: string; confidence: string; reason: string; repairType: string }>;
        const damaged = evidence.filter((item) => item.status === "damaged").sort((left, right) => confidenceLevels.indexOf(left.confidence as any) - confidenceLevels.indexOf(right.confidence as any))[0];
        const visible = evidence.filter((item) => item.status !== "not_visible");
        const bestVisible = visible.sort((left, right) => confidenceLevels.indexOf(left.confidence as any) - confidenceLevels.indexOf(right.confidence as any))[0];
        const selected = damaged || bestVisible;
        return {
          panel,
          status: damaged ? "damaged" : bestVisible ? "not_damaged" : "not_visible",
          confidence: selected?.confidence || "low",
          reason: selected?.reason || "Not clearly visible in the supplied photos.",
          repairType: alwaysReplace(panel) ? "replacement" : selected?.repairType || "unclear",
        };
      });
      const cleanPanels = cleanChecklist.filter((item) => item.status === "damaged").map(({ panel, repairType, confidence, reason }) => ({ panel, repairType: alwaysReplace(panel) ? "replacement" : repairType, reason, needsAnotherPhoto: confidence === "low" }));
      const bestModelFinding = [...modelFindings].sort((left, right) => confidenceLevels.indexOf(left.modelConfidence as any) - confidenceLevels.indexOf(right.modelConfidence as any))[0];
      const mismatchFinding = modelFindings.find((item) => item.modelConfidence === "high" && item.modelMatchesSelected === "different" && item.detectedModel);
      const modelFinding = mismatchFinding || bestModelFinding;
      const modelConfidence = modelFinding?.modelConfidence || "low";
      const modelMatchesSelected = mismatchFinding ? "different" : modelFinding?.modelMatchesSelected || "uncertain";
      const detectedModel = modelFinding?.detectedModel || null;
      const modelReason = modelFinding?.modelReason || "The model could not be identified from these photos.";
      const confidentMismatch = !!mismatchFinding;
      const needsMorePhotos = modelFindings.some((item) => item.needsMorePhotos) || modelConfidence === "low" || cleanChecklist.some((item) => item.status === "not_visible" || item.confidence === "low") || cleanPanels.some((item) => item.repairType === "unclear");
      if (cleanPanels.some((item) => item.repairType === "unclear")) throw new Error("Please upload a clearer close-up of the damage so the work can be assessed.");
      const prices = !confidentMismatch && cleanPanels.length ? await ctx.runAction(internal.priceEstimates.estimateAll, {
        carModel:selectedModel, carSize, city, items:cleanPanels.map(({ panel, repairType }) => ({ panel, repairType:repairType as "repair" | "replacement" | "denting_painting" })),
      }) : { estimates:[] };
      return await ctx.runMutation(internal.inspections.save, { cacheKey, photoHash, ...(variant ? { variant } : {}), result: { photoHash, isCarPhoto:true, selectedModel, ...(variant ? { variant } : {}), detectedModel, modelConfidence, modelReason, confidentMismatch, panels:cleanPanels, estimates:prices.estimates } });
    } catch (error) {
      console.error(JSON.stringify({ event: "photo_inspection_failed", photosReceived: storageIds.length, photosSentToAI, partsFound: null }));
      throw error;
    } finally {
      await Promise.all(storageIds.map((id) => ctx.storage.delete(id)));
    }
  },
});

// Resolve the model using the saved inspection; never trust client-supplied damage or prices.
export const chooseCar = action({
  args: {photoHash:v.string(), originalModel:v.string(), originalSize:v.union(v.literal("small"),v.literal("medium"),v.literal("large")), chosenModel:v.string(), carSize:v.union(v.literal("small"),v.literal("medium"),v.literal("large")), city:v.string()},
  handler: async(ctx,args):Promise<any> => {
    const originalKey=JSON.stringify(["inspection-v2",args.photoHash,args.originalModel.trim().toLowerCase(),args.city.trim().toLowerCase(),args.originalSize]);
    const inspection=await ctx.runQuery(internal.inspections.get,{cacheKey:originalKey});
    if(!inspection || !inspection.isCarPhoto) throw new Error("Inspection not found. Please check your car again.");
    if(args.chosenModel!==args.originalModel && args.chosenModel!==inspection.detectedModel) throw new Error("Choose one of the two car models.");
    const cacheKey=JSON.stringify(["inspection-choice-v1",args.photoHash,args.originalModel.trim().toLowerCase(),args.chosenModel.trim().toLowerCase(),args.city.trim().toLowerCase(),args.carSize]);
    let result=await ctx.runQuery(internal.inspections.get,{cacheKey});
    if(!result) {
      const prices=args.chosenModel===args.originalModel && inspection.estimates?.length ? {estimates:inspection.estimates} : await ctx.runAction(internal.priceEstimates.estimateAll,{carModel:args.chosenModel,carSize:args.carSize,city:args.city,items:inspection.panels.map(({panel,repairType}:any)=>({panel,repairType}))});
      result=await ctx.runMutation(internal.inspections.save,{cacheKey,photoHash:args.photoHash,result:{...inspection,selectedModel:args.chosenModel,userChoice:args.chosenModel,estimates:prices.estimates}});
    }
    await ctx.runMutation(internal.inspections.recordChoice,{cacheKey:originalKey,choice:args.chosenModel});
    return result;
  }
});
