# DESIGN gaps

Audited against https://earnest-rhinoceros-454.convex.site at 390 px on 2026-10-13. The initial audit was written before presentation edits. Source requirement wording and line numbers below come directly from DESIGN.md. Blank lines, section headings, category-only labels and the empty final bullet have no independent acceptance criterion.

Status is the live state before changes. Outcome is the final disposition. Already done means fixed/satisfied without a change. Protected gaps remain not fixed under Needs my decision.

| Line | DESIGN.md requirement | Live site before changes | Status | Outcome |
| --- | --- | --- | --- | --- |
| 2 | Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing. | DESIGN.md read before the audit; later language, partner and email instructions retained. | done | Fixed — already satisfied |
| 5 | When user lands on our screen it should give him a feeling he has walked into a expert and premium online garage with experts garage expert to help him – just like when you walked into reputed hospital you feel your in safe hands – Like the expertise of doctors into different areas of diaganosis | Friendly mechanic and conversational flow; the large repeated hero crowds later phone screens. | partly done | Fixed — Compact later-step layout and consistent typography |
| 6 | One big thing they would see I would like to online sketch of garage mechanic that give the user of feeling like talking to mechanic | Large SVG Indian mechanic with cap, boilersuit, wrench and open bonnet. | done | Fixed — already satisfied |
| 7 | The only things that were appear with colour is the garage but it also needs to be polished – which gives him the confidence that we have shortlisted few for him ais on this logic - rated 4+, within 5 km, open now, only car garages , the one who have been reviewed recently, one who is popular | Customer screens mostly neutral; admin/errors retain green/orange. Search expands from 5 to 50 km; rating/open filters are optional; partners are pinned within 10 km. | partly done | Fixed — Neutral presentation fixed; shortlist rules need decision ND1 |
| 9 | The pop-ups should not appear immediately and no ads of garages to sell him or loot him | No immediate overlay or ads; garage quote invitation appears after interaction and explicit consent. | done | Fixed — already satisfied |
| 12 | Conversational AI like Vaani.ai from meesho who helps customers | AI asks short contextual questions; selected English/Hindi/Marathi is remembered. | done | Fixed — already satisfied |
| 13 | • Take: photo on the left, rating chip on the photo, name, then distance and area on one line. | Photos span the top of cards, rating sits below photo, and area is separate from distance. | missing | Fixed — Left photo, rating overlay, distance and area on one line |
| 14 | • Ignore: offer pills, "Ad", "#4 in top deals", the bookmark, the Kotak banner. All of it feels like an ad. | No offers, ads, deal ranking, bookmarks or sponsor banners. | done | Fixed — already satisfied |
| 19 | Font: Gambetta for headings, Chivo for everything else | Customer flow uses Gambetta/Chivo; live admin and shared pages use Inter. | partly done | Fixed — Gambetta headings and Chivo body across routes |
| 21 | Sizes: 3 or 4 sizes, e.g. 32 headline, 20 headings, 16 body | Customer uses 32/20/16/13 px plus 11/14 px labels; other routes have additional tiny sizes. | partly done | Fixed — Consolidated 32/20/16/13 px hierarchy |
| 23 | Colours:  #1E3A8A | Navy garage badges exist; green admin branding and orange error decoration remain. | partly done | Fixed — Navy garage accents; neutral non-garage UI |
| 25 | The colourful mechanic mascot is the one exception to "only garages bring colour". | Mechanic SVG retains navy, amber and natural skin/neutral tones. | done | Fixed — already satisfied |
| 28 | Flow: The flow has to be built on conversational AI | Single conversational customer flow backed by AI question presentation. | done | Fixed — already satisfied |
| 29 | 1) Customer land on the website / app | Live landing loads the named app and first question. | done | Fixed — already satisfied |
| 30 | 2) AI agents ask for his name | New visitors are asked their name. | done | Fixed — already satisfied |
| 31 | 3) AI Agent then ask how can I help you – this is has to be conversational – can change depending on the user language | AI asks how to help and follows the selected language. | done | Fixed — already satisfied |
| 32 | 4) Customer describes the issues | Help and optional story inputs collect the customer description. | done | Fixed — already satisfied |
| 33 | 5) AI Agents ask for car and variant | Car autocomplete asks make, model and variant. | done | Fixed — already satisfied |
| 34 | 6) Agents lets me check by asking him photos – with photo icon – where he understands the photo needs to be uploaded here | Photo upload has a camera icon and asks for close-up/wider views. | done | Fixed — already satisfied |
| 35 | 7) While we are inspecting – AI agents tell them to sit back and relax – again conversational | AI loading reassurance exists, but English upload/status text competes with the loading bubble. | partly done | Fixed — Clear loading/status hierarchy; no inspection change |
| 36 | 8) Resuts come and estimate is appeared in the format of just like garage | Repair estimate card shows rows and totals but lacks complete garage-sheet labels. | partly done | Fixed — Garage-sheet presentation; source price/quantity gaps remain ND2 |
| 37 | 9) we ask would you like to know nearby garages that can help u get this repaired | Nearby garages are offered after the estimate. | done | Fixed — already satisfied |
| 38 | 10) If yes – ask for the location – if no – the journey ends by saying hope we were helpful | Yes opens area/location controls; no ends with a thank-you. | done | Fixed — already satisfied |
| 39 | 11) Post the user scroll through garages reading the reviewing – ask him would he like to get garage from nearby garages | Browsing garage reviews reveals a separate request-consent question. | done | Fixed — already satisfied |
| 40 | 12) If yes – ask him for his number | Phone form opens only after requesting garage quotes. | done | Fixed — already satisfied |
| 41 | 13)  then tell him we have send your request to nearby garages . our experts/garages will soon get back to you | Success truthfully says saved for the team, not already dispatched to garages. | partly done | Not fixed: dispatch timing needs decision ND3 |
| 42 | 14) Post this sent the requests to garages on whatsapp with name , city, location and exact cause and ask for estimate – Car mechanic – sends this estimate manually to garage owners | Request saves to admin and emails owner; owner can copy garage text. No automatic WhatsApp dispatch. Later instructions exclude customer identity/estimate from garage copy. | missing | Not fixed: dispatch/privacy change needs decision ND3 |
| 44 | [Screen name] – There would be single with conversational flowing and after each conversation ends the next appears ( ensuring the previous conversation is not there) – | Previous chat answers are removed, but the large landing hero persists through later steps. | partly done | Fixed — Hide landing-only hero content after the first step |
| 45 | For: This screen is for customer to diagnose his car and get connected to nearby garages | Damage diagnosis, estimate, garage browsing and request flow are available. | done | Fixed — already satisfied |
| 47 | Brand Name | MyCarMechanic appears in the header. | done | Fixed — already satisfied |
| 48 | Brand Logo | Live logo is an M monogram; local initial markup contains an F placeholder. | partly done | Fixed — Consistent monochrome car/wrench SVG logo |
| 49 | Headline | Approved headline appears on landing. | done | Fixed — already satisfied |
| 50 | Subtitle | Approved subtitle appears below the headline. | done | Fixed — already satisfied |
| 51 | AI Greeting | Mechanic greeting appears before the active input. | done | Fixed — already satisfied |
| 52 | Estimates | Estimate is below the greeting, with incomplete sheet headings. | partly done | Fixed — Garage-sheet presentation |
| 53 | 1) Estimate shoud contain row by row spare part price | Each part has an inclusive repair range and conditional replacement range, not a separate spare-part unit price. | partly done | Fixed — Layout fixed; separate component prices need decision ND2 |
| 54 | 2) It should have columns like s.no , spare part name , price and quantity | Part/work/price appear, but serial and quantity columns are absent. Actual quantities are not returned by inspection. | missing | Fixed — No./part/price/quantity labels; quantity shown as garage to confirm, ND2 |
| 55 | 3) Also if its labour then it should identify | Labour is mentioned in the total, not identified beside individual jobs; no separate labour figures exist. | partly done | Fixed — Per-job labour-included label; breakdown needs decision ND2 |
| 56 | 4) Job type – it repair or replacement | Fix labels such as refit/dent pull are shown; explicit repair/replacement job type is absent. | partly done | Fixed — Explicit job-type label from existing repairType |
| 57 | 5) Copy of garage estimate – it should like that | Looks like a price card rather than a complete garage estimate sheet. | partly done | Fixed — Numbered, labelled garage-sheet layout without changing values |
| 58 | Nearby garages list – just like Zomato cards | Garage cards exist, but use top photos instead of the specified left-photo layout. | partly done | Fixed — Left photo and compact card layout |
| 59 | Thank you message – Thank you for trusting us to help you | Request receipt and ending thank the customer for their trust. | done | Fixed — already satisfied |
| 61 | 1) Inspect | Inspect button starts the existing inspection action. | done | Fixed — already satisfied |
| 62 | 2) Fetch nearby garages | Fetch garages opens location controls and performs the existing search. | done | Fixed — already satisfied |
| 63 | 3) Send quotes to garages | Submit saves a request for manual forwarding, rather than dispatching it. | partly done | Not fixed: automatic dispatch needs decision ND3; Submit retained |
| 64 | Empty, first visit: Welcome to Car mechanic – we take care of your car diagnosis | First greeting is AI-generated and can omit the exact welcome words. | partly done | Fixed — Deterministic approved welcome plus conversational AI question |
| 65 | Empty, coming back: [words] – User name – how can we help you today | Returning device greeting uses the remembered name and asks how to help. | done | Fixed — already satisfied |
| 66 | Loading: Sit back and relax and AI mechanic will get back with your estimated range for your repair | Reassurance exists; loading text competes with upload text and repeated hero. | partly done | Fixed — Focused loading screen and readable progress copy |
| 68 | 1) If user uploads another image instead of car – Its tells its does not like car , please share the correct image | Existing inspection rejects non-car photos and asks for a correct/wider car photo. | done | Fixed — already satisfied |
| 69 | 2)  If user upload the the incorrect image – its ask for the clear and wider pictures | Small/invalid/conversion/upload errors have guidance; raw server errors can surface and local red/orange decoration remains. | partly done | Fixed — Friendly retry words and neutral readable error states |
| 70 | 3) If user upload the photo of another car and not the one mentioned – I guess you have shared another car picture | Existing mismatch screen explains selected versus detected model and asks the customer to choose. | done | Fixed — already satisfied |
| 72 | 1)Post photo uploaded - Sit back and relax and AI mechanic will get back with your estimated range for your repair | Upload/inspection reassurance is shown alongside competing progress text. | partly done | Fixed — Focused loading/status presentation |
| 73 | 2)  Post the estimate is being sent to garage – Allow us sometime and our experts will get back to you with competive rates | Saved-request receipt asks for time, explains manual forwarding and promises team follow-up without claiming dispatch. | done | Fixed — already satisfied |
| 75 | 1) If AI Estimate contains wrong part – User tell him I don’t think so this is damaged. check | Concern input and recheck button reuse the same photos. | done | Fixed — already satisfied |
| 76 | AI agents let me check and come back | Recheck loading reassures the customer and then shows a new comparison estimate. | done | Fixed — already satisfied |
| 78 | 2) If AI agents estimate is wrong – Customer hightlightts it and agent correct it | Customer can request a reassessment; AI may retain its finding/price. A correction is not guaranteed. | partly done | Not fixed: forced correction changes inspection/pricing, ND4 |
| 87 | Headline: Fair price, before the garage quotes | Fair price, before the garage quotes is the live headline. | done | Fixed — already satisfied |
| 88 | Under it: A little clarity before your garage visit. | A little clarity before your garage visit. is the live subtitle. | done | Fixed — already satisfied |
| 89 | Button: Inspect – Ai agent start inspecting | Inspect is the inspection action label. | done | Fixed — already satisfied |
| 90 | Fetch garages – near by garages list appeared | Fetch garages is the discovery action label. | done | Fixed — already satisfied |
| 91 | Submit – The quote is send to Car mechanic admin | Submit saves the request to admin. | done | Fixed — already satisfied |
| 94 | -  A Garage screen should not appear till the customer asks for it | Garage screen stays hidden until the customer asks for it. | done | Fixed — already satisfied |
| 95 | - Never sends estimate to garages until customer asks for it | No AI estimate is automatically sent to garages; garage copy excludes estimates/prices. | done | Fixed — already satisfied |
| 96 | -  The same photo / model – damage should give same estimate to customer A, B&C – Our estimates should be consistent | Existing cache keys include photo hash/model/city/size; identical inputs reuse the result. Prior live flows returned the same ranges. | done | Fixed — already satisfied |
| 97 | - No phone number to be asked till customer ask for the estimate | Phone is requested only after the customer accepts garage quote requests. | done | Fixed — already satisfied |
| 98 | - For estimates only AI intelligence to used no reference of garage | Inspection/pricing use AI; partner price sheets do not drive the AI estimate. | done | Fixed — already satisfied |
| 99 | - Estimates should be appeared in form of garage estimate form only | Estimate card has rows/totals, but incomplete garage-sheet headings. | partly done | Fixed — Garage-sheet presentation |
| 100 | - Estimates should tell the round off amount | Live prices are whole INR; existing pricing rounds to integer rupees. | done | Fixed — already satisfied |

## Needs my decision

- **ND1 — Not fixed (line 7):** Strict 4+, within 5 km, open-now, recent/popular, car-only shortlist rules differ from the existing expanding search and optional filters. Partner priority within 10 km is a later explicit requirement. Choosing different eligibility/search rules changes garage logic. Existing non-partner results are retained.
- **ND2 — Not fixed (lines 36, 53–57):** Inspection/pricing return inclusive job ranges, not spare-part unit prices, actual quantities or a parts/labour breakdown. The screen can label the existing values and show quantity as “Garage to confirm”; supplying those missing figures would change inspection/pricing. No quantity or monetary breakdown is invented.
- **ND3 — Not fixed (lines 41, 42, 63):** Automatic WhatsApp dispatch and claiming a request has already been sent differ from the current save/email/manual-forwarding flow. The older instruction to include the customer name conflicts with the later privacy rule for garage copy. Keep the truthful saved-request wording, current email and manual admin copy until a dispatch/privacy decision is made.
- **ND4 — Not fixed (line 78):** The existing recheck reassesses rather than guaranteeing a different result. Forcing corrections changes inspection/pricing. Existing inspection, prices, quote saving, QUOTE_PHONE and PostHog event hooks are unchanged.

## Verification

Phone-width live screenshots cover customer steps, returning visitor, inspection/recheck progress, estimates, location/search/cards/reviews/consent, quote form/save/receipt/ending, admin/settings/request, partner onboarding and shared photos. Controlled error/empty responses are explicitly labelled in the screenshot manifest; the normal flow uses real live inspection, search and saving. Languages, four partner settings, owner email acceptance, and the unchanged full-funnel event sequence are checked. See scripts/design-gaps-live-verification.json and scripts/design-gaps-production-deploy.log.
