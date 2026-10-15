# MyCarMechanic: the technology explained

Based on the code reviewed on 13 October 2026. Public prices were checked on the same date. This explains what is built, not everything we might build later. It contains no credentials or customer phone numbers.

## 1) The product in four parts

Think of MyCarMechanic as a garage reception desk, a team working behind it, a filing cabinet, and an outside AI service.

| Part | What it does in MyCarMechanic | Where it lives |
| --- | --- | --- |
| Screens: the reception desk | Shows the conversation, photo picker, estimate, garage cards, quote form and owner page. Responds to clicks and displays results. | `index.html`; appearance in `design.css`; language support in `localization.js` and `ui-translations.json`. |
| Backend functions: the team behind the desk | Checks inputs, runs inspections and searches, saves requests, calls outside services and sends email. These functions run on Convex, away from the customer's browser. | The `convex/` folder, especially `panels.ts`, `priceEstimates.ts`, `garages.ts`, `quoteRequests.ts` and `admin.ts`. |
| Database: the filing cabinet | Keeps saved inspection results, quote requests, partner settings and other records. Photos are stored as files, with references to them in the records. | The table definitions are in `convex/schema.ts`; the actual records and files live in the Convex deployment. |
| AI calls: the outside specialist | OpenAI receives a specific question, sometimes with photos, and returns an answer. Our code checks and turns that answer into something the screen can use. | `convex/panels.ts` for photo assessment; `priceEstimates.ts` for prices; `conversation.ts` for wording; `presentation.ts` for translation. |

The main database tables are:

- `inspections`: saved assessments and price ranges, plus a fingerprint of the uploaded photos.
- `quoteRequests`: the customer's details, car, location, work items, attached photos, email status and any manually recorded garage quotes.
- `garagePartners`: Google-listed garages that the owner has selected as quote partners.
- `partnerGarages`: a separate garage registration and price-sheet feature. These sheets do not supply the current AI estimate prices.
- `billChecks`: recent inspection/bill-check attempts used to enforce the hourly allowance.

An important detail: the current customer quote submission saves part names, job types and observations, but does not save the displayed low/high prices or total into the quote request. The priced assessment is held separately in `inspections`. A quote request is therefore a request for work, not a complete saved invoice.

## 2) The tools and why they fit this build

The code shows what each tool does. The reasons below explain its practical fit; where no original selection decision is recorded, they should not be presented as a documented comparison with competitors.

| Tool | What it does for us | Why it fits this build |
| --- | --- | --- |
| Codex | Helps read and change code, investigate bugs, run checks and explain results. | Lets the founder work with a coding assistant. It is a development tool, not the AI serving customers inside the app. |
| Git | Saves versions, such as “Before message match” and “Message match.” | Makes changes reviewable and allows a specific change to be undone. |
| GitHub | Can hold and share the Git project online. | Useful for collaboration and review, but no GitHub remote is configured in the local repository reviewed here. Uploading it is not established. |
| Convex | Runs backend functions, stores records and photos, and hosts the website through its static-hosting component. | Keeps several essential services in one system. `convex/convex.config.ts` connects the hosting component. |
| OpenAI GPT-4.1 | Assesses the damage photos in `convex/panels.ts`. | Can interpret pictures and return a structured assessment. This is an existing general model, not a model we trained ourselves. |
| OpenAI GPT-4.1 mini | Produces repair price ranges, conversation wording and translations. | Handles text jobs with a lower published token price than GPT-4.1. The model names are explicitly set in the code. |
| OpenAI Responses API | The connection used to send instructions and images to those models. | Lets the backend request structured answers and read the results. An API is simply a way for two programs to talk. |
| Google Places and Google Maps | Supplies area suggestions, garage locations, ratings, reviews, opening information and photos, plus links to Google Maps. | Provides an existing business directory instead of requiring us to build one. The code uses the newer Places API. |
| PostHog | Receives events such as `estimate_shown`, `garages_shown` and `quote_submitted`. | Helps us understand where customers continue or leave. The app sends explicit events rather than recording the whole screen. |
| Resend | Sends the owner a quote-request notification email. | Provides a direct email-sending connection. The app records whether the service accepted the email. |
| WhatsApp | The owner can contact a customer or paste the garage message into WhatsApp manually. | Fits the manual follow-up process. There is no WhatsApp Business API integration or automatic garage dispatch in the code reviewed. |
| Google Ads | Would bring visitors through paid advertising. | It is a marketing option, not a built-in app service here. No campaign or conversion connection is established by this repository. |
| HTML, CSS and JavaScript | Define the page, its appearance and its browser behaviour. | This app uses a direct web page rather than a React application. Much of the screen logic is in `index.html`. |
| TypeScript | Describes the backend code and the shapes of its inputs. | Helps developers catch certain mistakes before deployment; it does not guarantee correct AI answers. |
| Node.js and npm | Run development scripts and install code packages listed in `package.json`. | Build the website files and run the deployment commands. They are not separate services the customer must install. |
| Convex browser client and esm.sh | Let the web page call Convex functions; esm.sh supplies the imported browser library. | Provides the browser-to-backend connection. This also means page loading has an outside library dependency. |
| heic2any | Converts supported HEIC phone photos to JPEG in the browser. | Helps customers use iPhone photos. The library loads only when a HEIC photo is selected. |
| Browser image tools | Decode photos and use a canvas to prepare them. | Convert or enlarge small images without a separate image-processing server. Enlarging an image does not recover missing detail. |
| Browser location and storage tools | Ask permission for device location; remember the name/language locally and keep temporary journey state. | Reduce repeated typing. Remembering a name is not the same as having a customer account. |
| Fontshare and Google Fonts | Load Gambetta and Chivo, the fonts named in DESIGN.md. | Provide the chosen visual style without drawing the letters ourselves. |
| Playwright and Chrome | Run browser checks and take phone-width screenshots. | Check the actual screens and flow. These are development tools, not part of the customer journey. |
| PowerShell and the service command-line tools | Run local build, checking and deployment commands. | Let the developer operate the project. Deployment is a deliberate command; automatic GitHub deployment is not shown. |

The project still contains the earlier bill-reading function in `convex/bills.ts`. It reads visible bill lines using GPT-4.1 mini. Its presence does not mean the current customer journey is a complete bill-auditing product.

## 3) One request, end to end

Example: a customer has a Volkswagen Polo GT TSI in Pune, uploads a damage photo, searches in Kharadi, and asks for garage quotes.

1. **The conversation collects the basics.** `index.html` moves through name, problem, story, car/variant and city. `convex/vehicleCatalog.ts` supplies car and city options from `convex/data/`. `conversation.ts` asks GPT-4.1 mini to phrase the next question. If that call fails, approved fallback wording is available. The conversation function does not inspect the car or choose prices.

2. **The browser prepares the photo.** The photo code in `index.html` checks the format and size. It converts HEIC when needed and enlarges a photo whose longer side is below 1,024 pixels. The normal picker accepts JPG, PNG and HEIC. The inspection backend also accepts WebP.

3. **The photo is uploaded.** The page calls `bills:createUploadUrl` in `convex/bills.ts`, then sends the file to the upload address. Convex returns a file reference. Uploading alone does not inspect it.

4. **The backend checks for an existing result.** `panels:analyzeDamage` in `convex/panels.ts` reads the actual stored bytes and makes a digital fingerprint. It looks for an assessment matching those photos, car, city, vehicle size and inspection version. A matching saved result can be reused. A recheck also includes the customer's concern.

5. **A new assessment uses GPT-4.1.** If there is no matching result and the hourly allowance permits it, the backend sends the photos together to OpenAI. The instructions ask it to distinguish visible damage from reflections, identify uncertainty, and consider repair before replacement. The selected car is context, not proof of what appears in the photo.

6. **Our repair rules check the answer.** `convex/repairPlan.ts` sorts findings into confirmed damage and uncertain checks. For example, a loose but intact bumper can become a re-clip repair. Replacement needs stronger evidence such as a clearly broken part. These checks reduce some mistakes; they cannot prove the assessment is correct.

7. **A separate AI call estimates the price.** `convex/priceEstimates.ts` sends the car, city and work items to GPT-4.1 mini. It requests a low/high total including labour and needed materials. It does not read `PANEL_RATES.md`, garage partner sheets or actual garage quotes. The instructions include a calibration example for a simple refit, but that is guidance rather than a verified local price feed.

8. **The estimate appears.** `index.html` draws the estimate rows and sums the repair ranges. Conditional replacement prices appear separately and are not added to the cheapest-fix total. Uncertain findings are shown for a garage to check without a price. Missing or invalid price answers cause a retry message rather than an invented amount.

9. **The result is saved, and the inspection uploads are removed.** `convex/inspections.ts` stores the assessment and ranges. `panels.ts` deletes the temporary inspection photo files when the action finishes, including on failure. The browser still holds its selected photos for a later recheck or quote submission.

10. **Garages are searched only when requested.** The customer enters Kharadi or grants device-location permission. `convex/garages.ts` resolves the location and calls Google Places. It starts at five kilometres and may expand through ten, twenty, thirty and fifty kilometres if it finds too few suitable results. Distance shown is calculated from coordinates, not a driving route.

11. **Partners and card details are added.** `convex/garagePartners.ts` prepends enabled quote partners within ten kilometres and removes duplicates. `garagePresentation.ts` fetches garage photos and credits, area, closing information and review details. Tags such as “Quick service” come from matching phrases in positive Google reviews; they are not an independent quality audit. `index.html` displays the full-width photo cards.

12. **The customer explicitly requests quotes.** The page opens the quote form and asks for contact details and an optional year. It uploads quote copies of the selected photos and calls `quoteRequests:create` with the saved work items, car and location. This is a fresh upload because the temporary inspection files were deleted.

13. **The request is stored before email is attempted.** `convex/quoteRequests.ts` validates the submission and checks that quote collection is enabled. It inserts the request in `quoteRequests` before contacting Resend. The current availability check depends on a valid configured `QUOTE_PHONE`; this is not automatic WhatsApp sending.

14. **The email is built and sent to the owner.** `convex/quoteEmail.ts` creates the owner section with an IST time. `quoteMessages.ts` builds the garage section from every saved work item and the full car details, using locality or city fallback. It adds the shared photo link and ends with the request for a total price and availability. Resend receives this plain-text body.

15. **The owner follows up manually.** `convex/admin.ts` supplies the owner page with requests, email status, partner controls and “Copy for garage.” English garage copy uses the same builder as the email; Hindi and Marathi copy adds translation. The backend also has functions to record a garage quote and mark a request as forwarded. There is no automatic garage bidding, booking or payment process.

The real same-photo verification found three saved Repair items: front bumper, front LHS door and LHS fender. An older assessment of identical photo bytes had five parts with mixed job types. That difference came from the assessment, not the latest message builder. We should not promise that results never change when the assessment rules or versions change.

## 4) Running costs and limits

There is no trustworthy monthly bill or per-customer cost in the source code. The practical equation is: AI usage + Convex usage + Google requests + email + any advertising + development tools and manual follow-up time. The account plans, actual usage, taxes and currency conversion must be checked separately.

### Public pricing reference

Prices below are reference prices, not a claim about our current account bill.

| Service | Cost basis and example |
| --- | --- |
| OpenAI GPT-4.1 | Standard published pricing is $2 per million input tokens and $8 per million output tokens. Tokens are the pieces of text and image input that the service counts. [Official GPT-4.1 pricing](https://developers.openai.com/api/docs/models/gpt-4.1). |
| OpenAI GPT-4.1 mini | Standard published pricing is $0.40 per million input tokens and $1.60 per million output tokens. Conversation, pricing, translation and retries can create separate calls. [Official GPT-4.1 mini pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini). |
| Convex | Free/Starter includes allowances; Starter charges for extra usage. The published entry allowances include one million function calls, 0.5 GB of database storage, 1 GB of file storage and 1 GB of data leaving the service. Professional starts at $25 per developer per month, plus usage beyond its allowances. [Convex pricing](https://www.convex.dev/pricing). |
| Google Places | Charges depend on the type of request and the details requested. Searching, retrieving reviews and obtaining photos can be separately billable. India-specific rates may apply if the account qualifies. One customer search is not necessarily one billable Google call. [Places billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) and [India pricing](https://developers.google.com/maps/billing-and-pricing/pricing-india). |
| Resend | The published free email allowance is 3,000 per month, with a 100-per-day limit. Pro is $20 per month for 50,000 emails. [Resend pricing](https://resend.com/pricing). |
| PostHog | The published analytics allowance is one million events per month; usage above that depends on the plan. An event is a tracked step, not a customer, so one customer produces several events. [PostHog pricing](https://posthog.com/pricing). |

Illustration only: a GPT-4.1 call with 10,000 billable input tokens and 2,000 output tokens costs $0.036 at those standard rates. A mini call with 2,000 input tokens and 500 output tokens costs $0.0016. Those two calls together would cost $0.0376. That is not our measured cost per customer: actual image inputs, conversation turns, translation, rechecks and retries change the total.

Codex access, any paid GitHub plan, a custom domain and Google Ads would be separate expenses. Their current plans or budgets are not established here. WhatsApp forwarding is currently manual, so there is no integrated WhatsApp API bill shown; the human time still costs something.

### Limits that are actually in the app

- **Ten new inspection/bill-check attempts per rolling hour across the deployment.** `bills:consumeHourlyCall` is a shared allowance, not ten per customer. A cached inspection skips it; a new recheck may consume it. It does not cap all conversation, translation or Google calls.
- **Up to eight inspection photos, each no larger than 8 MB.** The longer side must meet the backend's 1,024-pixel check. The code has twenty-one named panel categories.
- **Quote requests accept at most twenty parts, twenty garage names and eight photos.** These are validation limits, not a claim that every request has those amounts.
- **Google usage can multiply.** Search may try several radii and both distance and popularity searches. Partner refreshes, reviews, card details and photos add calls. A browser cache helps reuse some card results during the session, but it is not a permanent shared Google-data cache.
- **Large photos affect storage and data transfer.** Quote photos remain until the request is deleted. Files downloaded from Convex use its data-transfer allowance. The retained optimisation lets browsers reuse versioned static files for a long period and delays loading the HEIC converter.
- **The app relies on several outside services.** A page can still show fallback chat wording, but failed AI pricing, Google search or email has different consequences. The request is retained if email fails, and the owner page can show “Email failed.” A general automatic email-retry queue is not built here.
- **Provider account limits still apply.** Our hourly allowance is not a substitute for OpenAI, Google, Convex or Resend quotas. Earlier deployments reported a free-plan limit warning; current account headroom was not measured for this document.
- **Email acceptance is not proof of delivery.** The latest evidence could not retrieve sent email text because the Resend credential was send-only. A received email or read-enabled provider access is needed for that check.

## 5) Ten questions people will ask

1. **“How does the AI know the price?”** It generates a city- and car-specific range from its general model knowledge and our repair instructions. It does not obtain a live quote from a garage or use a fixed bill table. These ranges still need validation against real repair bills.

2. **“Did you train your own AI?”** No. We call existing OpenAI models. Our contribution is the customer journey, instructions, repair rules, validation, saved results, garage discovery and follow-up workflow.

3. **“Where is customer data stored?”** Saved requests and assessments are in Convex, and quote photos are in its file storage. The name and language may also be remembered in the customer's browser. The deployed geographic region must be checked in the account; it cannot be inferred from the code. Relevant inputs also go to outside services: photos to OpenAI, search location to Google and owner email content to Resend.

4. **“Is it safe?”** It has some safeguards: service credentials stay in backend configuration, owner actions require an admin password, inputs are checked, and garage copy strips customer contact details and prices. It is not a completed security audit. Shared quote/photo pages use a link without a garage login, and the app has public upload and request functions. Stronger access controls and abuse protection need review before making broad security claims.

5. **“Can the AI miss damage or recommend the wrong work?”** Yes. It sees photos, not the physical car or hidden damage. We ask it to mark uncertainty and prefer safe repair before replacement, but a mechanic must confirm the work. The recorded five-part versus three-part result shows why we must keep testing accuracy.

6. **“Will the same photo always give the same answer?”** A matching saved inspection can be reused, which helps consistency. A different city, car, concern or inspection version can lead to another assessment. Results have changed between versions, so we cannot promise permanent identical answers.

7. **“Where do the garages and partner labels come from?”** Google supplies the ordinary business data. The owner selects quote partners in the admin page, and enabled nearby partners are put first. The partner label is our setting, not proof of an independent quality certification or a guaranteed reply.

8. **“Does the app automatically send requests and book repairs?”** No. It saves the customer's request and emails the owner. The owner manually copies and forwards the garage message. Automated WhatsApp dispatch, booking, payment and confirmed garage responses are not built into this flow.

9. **“Can this serve thousands of customers today?”** The hosted services can offer larger capacity, but this implementation is not proven at that scale. The shared ten-per-hour inspection allowance, service quotas, repeated Google calls, photo transfer and manual forwarding are immediate constraints.

10. **“How do you know the estimate, saved request and email match?”** The latest real TEST flow compared the displayed parts, AI findings, saved work items and shared email/WhatsApp formatter. They matched for that case. However, request creation accepts work items supplied by the browser rather than securely linking them to one inspection record, and it does not save the displayed price ranges in the quote request. That limits the audit trail. Raw provider-email verification also remains unfinished.

This file explains the current implementation. It does not change code, deploy the app, submit a live request or create a commit.
