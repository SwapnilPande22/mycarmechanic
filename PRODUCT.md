# Fair Car AI Auditor — Product

## Job to be done

When a car owner has accident damage, a dent, or a scratch, help them understand which visible panels may be damaged, what repair type may be needed, and the rough cost using available panel rates. This should reduce the time spent calling or visiting garages just to get an initial estimate.

## Milestone 1 user flow

1. Enter the car model and upload up to five clear damage photos.
2. AI identifies visible panels and suggests denting and painting, replacement, or needs review. It asks for clearer or additional views when the photos are uncertain.
3. The owner reviews and can correct each panel and repair type.
4. The app maps i10, Tiago, and Polo to Hatchback; Punch to Small SUV; and Seltos to SUV. It looks up the vehicle class, panel, and repair type in `PANEL_RATES.md` data. Each displayed rate names its source car. It shows part and labour amounts separately and sums only items with complete rates.
5. Missing model or rate data is shown as unavailable. A total is marked partial or unavailable when any panel cannot be priced. AI never sets or fills in prices.

## Main user concern

The owner needs to know whether the AI has noticed the relevant damaged panels and whether its repair classification makes sense. Estimates are only as complete as the available rates. Owners currently rely on friends, family, and familiar garage owners for this judgment.

## V1 includes

- Multiple damage-photo upload and car-model entry.
- AI panel identification and repair-type classification, with confidence and uncertainty cues.
- Requests for additional/clearer photos when assessment is uncertain.
- Owner correction of panel and repair type.
- Deterministic vehicle-class/panel/repair-type lookup from the rate table, source-car attribution, and transparent partial/unavailable totals.

## V1 excludes

- AI-generated pricing.
- Garage or mechanic quality reviews and best-garage recommendations.
- Sending quote requests or connecting to nearby garages.
- Insurance-policy reading or claim-versus-out-of-pocket advice.
- Live video mechanic/avatar inspection.

## Success measures

Track separately for each case:

1. Whether the owner agrees that the visible damaged panels were identified.
2. Whether the repair type (denting and painting or replacement) matches the garage's recommended work.
3. Whether every identified panel has a complete rate in the table, whether the displayed total is complete or partial, and whether the source-car attribution is visible.
4. For cases with complete rates, compare the listed-rate estimate with the garage estimate and final repair bill. Do not treat the former AI-generated pricing result as a validation of these lookup rates.
5. Whether the owner says the estimate helped them decide what to do or saved time.

## Riskiest assumptions and evidence

### Guess 1: Photo assessment is useful

If the AI cannot identify visible damaged panels and distinguish repair from replacement well enough, this product is not useful.

**Earlier test:** Five car cases were assessed. Only two AI-generated price estimates were within 20% of the garage estimate. Multi-panel jobs were underpriced, and some damage was misclassified as denting/painting when repair or replacement was needed.

**Product change:** Pricing is now a deterministic lookup from `PANEL_RATES.md`. AI only identifies visible panels and proposes a repair type. Rates are keyed by vehicle class (i10/Tiago/Polo hatchback, Punch small SUV, Seltos SUV) and retain their source car. Multi-panel totals sum each complete panel rate; missing class or panel data stays visibly missing. Panel identification and repair classification must still be evaluated against garage findings.

### Guess 2: Owners need this when damage occurs

It is uncertain whether owners will use the product when they have a damaged car. The current plan is to invite owners with recent damage to try the photo flow and ask whether the panel assessment and listed estimate were useful. If access to such cases is low, recruit through local car-owner communities or people currently at garages, then consider broader outreach.

## Milestone 1

A car owner can upload damage photos, enter a model, review and correct identified panels and repair types, and see a rough estimate from available part and labour rates grouped by vehicle class. The app names each rate's source car, clearly identifies missing rates, and does not imply the estimate includes unlisted work. Milestone 1 does not include nearby garage quotes, garage recommendations, or insurance decisions.
