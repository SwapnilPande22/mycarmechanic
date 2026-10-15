# MyCarMechanic build journey

Written on 13 October 2026. Dates below use Indian Standard Time (IST).
This account is based on all 49 commits in the available Git history, PRODUCT.md, DESIGN.md, AGENTS.md, and the saved verification records. A commit is a saved version of the project; it does not, by itself, prove that a feature worked for real customers.

## 1) What MyCarMechanic does, in 3 lines

MyCarMechanic asks a car owner about their car and uses damage photos to suggest the repair work and a rough price range.
If the owner wants help finding a garage, it shows nearby garages with photos, reviews, opening status and partner labels.
If the owner asks for quotes, it saves their request and emails the owner of MyCarMechanic, who can copy a message and manually forward it to garages.

## 2) Day-by-day timeline

### 3 October 2026 — The first version

The first commit, “Build Pune garage bill landing page,” created a simple page for people worried about a garage bill. A second commit, “Add Convex powered bill line analyzer,” connected the page to a service that could analyse bill items. The first product notes and basic data storage were added.

### 4 October 2026

No commit is recorded for this day. The history does not tell us whether work happened without being saved.

### 5 October 2026

No commit is recorded for this day.

### 6 October 2026

No commit is recorded for this day.

### 7 October 2026

No commit is recorded for this day.

### 8 October 2026

No commit is recorded for this day.

### 9 October 2026

No commit is recorded for this day. Later investigation found saved inspection results dated this day, but those are not a record of which code changes were made that day.

### 10 October 2026 — From bill checking to a repair conversation

“Chat flow, saved” recorded a much larger app. It included a conversation about the customer's problem, car and city; damage-photo uploads; AI inspection; repair estimates; nearby garages; and saved quote requests. Car variants, location suggestions, garage photos and reviews, an owner administration page, and a way to share damage photos were included. Verification records covered the customer conversation, garage browsing and request saving.

### 11 October 2026 — A clearer design direction

DESIGN.md was added to describe the intended experience: a calm, expert garage assistant, a conversation that moves one step at a time, and an estimate that resembles a garage estimate sheet. “Chat flow per DESIGN.md” brought the conversation closer to that plan. A “Before” commit saved a checkpoint before the change, and checks compared the new flow with the existing inspection and request behaviour.

### 12 October 2026 — Better rechecks, repair choices and communication

“Recheck and autosuggest fixes” made a customer's concern part of a genuine reassessment of the photos, rather than simply returning the original answer. It also adjusted the car and city suggestion behaviour.

“Cheapest fix first” changed how damage was assessed and priced. The app was told to consider securing or repairing an intact part before replacing it, to avoid treating reflections as damage, and to show uncertain findings as things to check at a garage. Replacement became a separate conditional alternative instead of automatically being added to the repair total.

“Natural chat and mascot” made the conversation more natural and added the mechanic character. Later, email alerts were added for quote requests. A customer saying the estimate looked right could continue without triggering another inspection.

“Languages and garage copy” added English, Hindi and Marathi support and a garage message that could be copied from the owner page. Saved records showed a Marathi customer flow and Hindi garage copy. Email checks confirmed that a request could be saved and accepted by the email service, but acceptance was not proof that the recipient had read it.

### 13 October 2026 — Tracking, partners, design corrections and message fixes

Early in the day, the PostHog destination was corrected and a page-view event was added. Tracking was then expanded to follow the main steps from arriving on the page to requesting quotes. Verification records checked that the events reached the service.

“Partner garages first” put selected partner garages ahead of other results and added their quote-response label. Live checks covered Kharadi and Hinjewadi.

“Design gaps fixed” improved fonts, spacing, estimate presentation, customer wording, error messages and other screens. At that point, the written design called for a small photo on the left of each garage card. Some larger product decisions were deliberately left open.

“Lead wording” separated the private owner information from the message intended for garages. The email and copied garage message used one shared message builder, so they could follow the same wording.

“Egress cut” tried to reduce the amount of data downloaded and uploaded. It introduced smaller garage images, compressed customer photos, small photo previews, loading the HEIC photo converter only when needed, and long cache periods for static files. Measurement records showed a large reduction for that particular test run.

In the evening, “Restore customer look” removed the photo and preview changes that affected the experience. Only loading the HEIC converter when needed and the long static-file cache periods were retained from the egress work. Comparison screenshots checked the restored customer screens against the earlier version.

“Big garage cards” then made the requested layout explicit: one full-width garage photo at the top, its credit on the photo, and the garage details underneath. DESIGN.md was updated to match. A live phone-width screenshot showed two complete Kharadi cards. Partner labels and the search behaviour were kept.

“Email fix” put each damaged part on its own numbered line, omitted an unknown year, changed the owner's request time to IST, and revised the location wording. Requests named “Egress measurement (do not contact)” were deleted. A new TEST request was also deleted after checking it. However, that test supplied its parts manually, so it did not prove that the email matched a real inspection.

“Message match” investigated the saved requests and photos before making another message change. It fixed the missing car variant and allowed the saved city when no locality was given. A real TEST customer flow used the same photo for a Polo GT TSI in Kharadi. The displayed estimate, saved request and garage message all contained the same three Repair items. The final reply instruction was present at the end of the plain-text email body. The TEST request was deleted afterwards.

Many changes had a “Before” checkpoint, an implementation commit, and a separate commit recording screenshots or checks. This made it easier to compare versions and undo a specific change without discarding later fixes.

## 3) The main problems and how they were handled

- **Unreliable early estimates:** PRODUCT.md records an early five-case exercise in which only two AI price estimates were within 20% of the garage estimate. Some multi-part work was underpriced or misclassified. The document proposed using a fixed rate table. Later code instead used AI price ranges and the “Cheapest fix first” approach. These are changes in approach, not proof that estimate accuracy is now solved.
- **Rechecks and suggestions:** Customers needed their concern to influence a recheck, and the car/city suggestions needed corrections. The recheck change included the concern in a new assessment and adjusted the suggestion behaviour. A recheck can still reach the same conclusion or ask the customer to retry.
- **The wrong garage layout:** The small left-side photo followed an earlier design instruction, but it was not the layout the owner wanted. “Big garage cards” changed both the cards and DESIGN.md to a full-width top photo.
- **Data savings harmed the presentation:** The egress changes reduced image quality and replaced large shared photos with small previews or links. “Restore customer look” rolled those changes back while keeping the two invisible loading and caching improvements.
- **Incomplete garage messages:** Earlier wording lost the variant, sometimes showed an unhelpful location placeholder, placed the first part beside “Damage:”, and could combine several parts into one line. The message fixes retained the saved car details, used locality with city fallback, and listed every saved part separately with its saved job type. Email and English garage copy use the same message builder.
- **A message bug was confused with an estimate change:** For identical photo bytes, an older saved request had five parts with mixed job types, while a newer one had three Repair parts. Saved inspection records confirmed that the assessment had changed before the message was written. The formatter was fixed for the variant and location; it did not invent the missing older parts or change the newer estimate.
- **Email proof was incomplete:** Resend accepted the TEST emails, but the configured credential could only send emails, not retrieve sent messages. The recorded body was therefore labelled as formatted from the saved request, not as raw text retrieved from the provider. Raw-email verification remains open.
- **Tracking went to the wrong destination:** The PostHog region was corrected, and page-view and journey events were checked again. Recorded checks confirmed receipt of those events.
- **Test requests cluttered the live app:** The named egress requests were removed. The later tests used names starting with TEST and deleted their saved requests and attached quote photos afterwards.

## 4) The tools used

- **Codex:** The coding assistant used to read the project, make changes, run checks and explain the results.
- **GitHub:** A place to store and share a Git project online; the history reviewed here does not establish that this local repository was uploaded there.
- **Convex:** Runs the app's server-side work, stores requests and photos, and hosts the live website.
- **PostHog:** Records steps in the customer journey so the owner can see where people continue or stop.
- **Resend:** Sends the quote-request notification email to the owner of MyCarMechanic.
- **Google Ads:** A paid advertising service for bringing people to the site; this history does not confirm an active campaign or conversion setup.
- **Git:** Saves project versions and lets us compare or restore a specific change.
- **Google Maps and Places:** Supplies nearby garage information, photos, opening information and reviews.
- **OpenAI:** Supplies the AI used for conversation, damage assessment, translation and the current repair price estimates.
- **Playwright and Chrome:** Run browser checks and capture screenshots, including narrow phone-width views.

## 5) Mistakes worth not repeating

- Read DESIGN.md before changing a screen, as AGENTS.md requires. When the intended layout changes, update the design instruction too.
- Do not trade away useful photos or readability just to reduce data usage. Check the actual customer screens after an optimisation.
- Compare the saved request and inspection before blaming the email. A message cannot recover a locality that was never saved or safely invent an older set of damaged parts.
- Do not use manually supplied test parts as proof that a real estimate matches its email. Follow the actual photo-to-estimate-to-request journey.
- Never submit a live test request unless its name starts with TEST. Delete it and its attached quote photos after collecting the evidence.
- Do not call a reconstructed email body “raw email proof.” Distinguish formatting checks, provider acceptance, retrieved email text and actual delivery.
- Keep the email and WhatsApp garage copy in one shared message builder. Keep every saved part and its actual job type.
- For a layout or message task, do not also change inspection, pricing, garage search, partner behaviour or request saving.
- Keep credentials, tokens and customer contact details out of journey documents and public evidence.
- Keep product documents up to date. An old plan should not be presented as the app's current behaviour.

## 6) What is still open

- **Estimate consistency and accuracy:** The same photo produced different saved assessments at different stages of development. The message investigation established that this happened; it did not resolve whether the newer assessment is more accurate. Real garage findings are still needed to judge it.
- **Raw-email verification:** The current send-only Resend credential prevents retrieving the sent TEST email. A received email body or suitable read access is needed to finish that proof.
- **Current service limits:** Earlier deployment output warned that the project was above free-plan limits. Some data-saving changes were later reversed, so their earlier savings cannot be claimed for today's app. Current usage and capacity still need checking.
- **Product-document conflicts:** PRODUCT.md says prices come from a fixed rate table and excludes nearby garages and quote requests. The current app uses AI price ranges and includes those garage features. The intended product description needs a separate decision and update.
- **Garage selection rules:** DESIGN.md describes a strict shortlist of highly rated, nearby, open garages. The recorded design review says this differs from the existing expanding search, optional filters and partner priority. The intended rule has not been settled by the layout fixes.
- **Estimate detail:** The app shows inclusive job ranges. It does not have confirmed spare-part quantities or a reliable separate parts-and-labour breakdown. Those figures should not be invented to make the sheet look complete.
- **Automatic forwarding:** Requests are saved and emailed to the owner, and garage copy is available for manual forwarding. Automatic WhatsApp dispatch and confirmed garage replies are not established by the latest checks.
- **Customer usefulness and marketing:** The history does not establish that enough real owners find the estimates useful, that garages respond reliably, or that a Google Ads campaign is running successfully.
- **Insurance advice:** It appears in the original idea, but it is not established as a completed feature of this build.

This journey file records the project as it stands on 13 October 2026. Writing it does not change the app, deploy anything or create a commit.
