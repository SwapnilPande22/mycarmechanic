# Fair Car AI Auditor — Product

## Job to be done

When a car owner has accident damage, a dent, or a scratch, help them understand which visible panels may be damaged, what repair type may be needed, and the rough cost using AI price ranges. This should reduce the time spent calling or visiting garages just to get an initial estimate.

## Milestone 1 user flow

1. Enter the car model and upload up to five clear damage photos.
2. AI identifies visible panels and suggests denting and painting, replacement, or needs review. It asks for clearer or additional views when the photos are uncertain.
3. The owner reviews and can correct each panel and repair type.
4. The app uses AI to estimate a low/high price range for each repair, based on the car model, vehicle size, city, panel and repair type. The ranges include labour and needed materials. It shows the cheapest safe fix and separate conditional replacement ranges; replacement alternatives are not added to the repair total.
5. Uncertain damage is shown as needing a check at a garage, without a price. If AI cannot produce a valid range for every priced item, the app asks the owner to try again.
6. If the owner asks, the app shows nearby garages with photos, Google reviews and opening status. Partner garages are shown first and labelled as replying to MyCarMechanic quotes.
7. If the owner asks for quotes, the app saves the request and emails the MyCarMechanic owner. The owner can copy the garage message and manually forward it to garages.

## Main user concern

The owner needs to know whether the AI has noticed the relevant damaged panels and whether its repair classification makes sense. Estimates are rough AI price ranges for the identified work. Owners currently rely on friends, family, and familiar garage owners for this judgment.

## V1 includes

- Multiple damage-photo upload and car-model entry.
- AI panel identification and repair-type classification, with confidence and uncertainty cues.
- Requests for additional/clearer photos when assessment is uncertain.
- Owner correction of panel and repair type.
- AI price ranges for the identified repair work, including labour and needed materials, with separate conditional replacement alternatives.
- Nearby garages with photos, Google reviews and opening status.
- Partner garages shown first, with the partner quote-response label.
- Saved quote requests, email notifications to the MyCarMechanic owner, and a garage message for manual forwarding.

## V1 excludes

- Independent garage or mechanic quality assessments and best-garage recommendations.
- Insurance-policy reading or claim-versus-out-of-pocket advice.
- Live video mechanic/avatar inspection.

## Success measures

Track separately for each case:

1. Whether the owner agrees that the visible damaged panels were identified.
2. Whether the repair type (denting and painting or replacement) matches the garage's recommended work.
3. Whether every confirmed repair has a valid AI price range, whether uncertain findings remain unpriced, and whether replacement alternatives are kept separate from the repair total.
4. Compare the AI price ranges with the garage estimate and final repair bill. Do not treat the earlier AI-generated pricing result as validation of the current estimates.
5. Whether the owner says the estimate helped them decide what to do or saved time.

## Riskiest assumptions and evidence

### Guess 1: Photo assessment is useful

If the AI cannot identify visible damaged panels and distinguish repair from replacement well enough, this product is not useful.

**Earlier test:** Five car cases were assessed. Only two AI-generated price estimates were within 20% of the garage estimate. Multi-panel jobs were underpriced, and some damage was misclassified as denting/painting when repair or replacement was needed.

**Product change:** Pricing now uses AI price ranges for the car, city and identified repair work, rather than a fixed rate table. AI identifies visible panels, proposes the cheapest safe repair and estimates its price range. Multi-panel totals sum the repair ranges; conditional replacement ranges are shown separately, and uncertain findings remain unpriced. Panel identification and repair classification must still be evaluated against garage findings.

### Guess 2: Owners need this when damage occurs

It is uncertain whether owners will use the product when they have a damaged car. The current plan is to invite owners with recent damage to try the photo flow and ask whether the panel assessment and AI price ranges were useful. If access to such cases is low, recruit through local car-owner communities or people currently at garages, then consider broader outreach.

## Milestone 1

A car owner can upload damage photos, enter a model, review and correct identified panels and repair types, and see rough AI price ranges for the repair work. The app includes labour and needed materials in each range, shows conditional replacement alternatives separately, and does not imply the estimate includes unlisted work. Milestone 1 includes nearby garages, partner garages and quote requests saved and emailed to the MyCarMechanic owner for manual forwarding. It does not include best-garage recommendations or insurance decisions.
