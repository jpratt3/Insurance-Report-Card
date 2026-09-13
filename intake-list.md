# Intake list — what the CFO sends, where it scores

The **starting bar** is set before this file is used: industry template + cash / EBITDA / revenue → max SIR and template limit floors.

This list is what the CFO uploads on the shared URL. After intake, the **final rubric for that company** is the starting bar **plus** anything here that raises a floor, triggers a knockout, or fills a pillar.

Company users never see the grade. Missing items on this list drive their checklist.

---

## How an item lands in the score

| Scoring category (pts) | What from intake feeds it |
| --- | --- |
| Limit adequacy (25) | Binder limits vs template floors; contract-exhibit minimums (max of the two); TIV vs property; vehicles vs auto; professional / E&O / cyber limits |
| Gaps and weak terms (20) | Missing required line for this template; “not requested” coverages; SE sublimits; BI waiting period; retro date vs years in business; umbrella not attaching |
| Deductibles / SIRs (15) | Policy retentions vs derived max SIR (updated if CFO supplies better financials) |
| Carrier quality (10) | Carrier name / AM Best on each binder |
| Loss history (10) | 5-year loss runs; WC EMR worksheet |
| Contract / COI compliance (10) | Additional insured, primary/non-contributory, waiver of subrogation on GL (and exhibits that require them) |
| Premium vs peers (10) | Premiums on binders vs revenue |

Knockouts (cap letter at D / F) are **not** a separate upload. They fire from the same files (no WC with employees, no professional at a clinic, etc.).

---

## What an exposure is

An **exposure** is the measurable unit of risk that drives loss potential — and the denominator insurers price against. Premium = rate × exposure base. It is what makes a $20M company's program comparable to a $50M one.

Three things that get conflated and shouldn't be:

- **Exposure** — the driver. *340 employees; $18M payroll; 52 locations.*
- **Hazard** — what makes that exposure worse. *Those employees perform hands-on spinal manipulation on minors.*
- **Loss** — what actually happened. *Two abuse claims, $1.4M incurred.*

Two companies with identical exposures can deserve very different grades because of hazard and loss. The rubric has to capture all three.

### Exposure base by line

| Line | Exposure base |
| --- | --- |
| Workers Comp | Payroll per $100, by class code **and** state |
| General Liability | Revenue per $1,000 (or payroll, sq ft, patient visits) |
| Property | TIV = building + contents + business income |
| Auto | Vehicle count by class / radius; non-owned = # drivers |
| Professional / Med Mal | Provider FTE count by specialty; patient encounters |
| Cyber / Tech E&O | Revenue, ARR, count of PII / PHI / PCI records |
| D&O | Revenue, total assets, capital structure |
| EPLI | Headcount by state |
| Crime | Monthly disbursements, largest single wire |
| Fiduciary | Plan assets, participant count |

---

## Every company (all templates)

| Intake item | Type | Scoring category | Notes |
| --- | --- | --- | --- |
| Binders / dec pages / schedule of insurance | Policies | Limits, gaps/terms, retentions, carrier, cost | Core program. One file per line is fine. |
| Loss runs (5 years or first-year attestation) | Exposure / claims | Loss history | Shape of losses, not just a total. |
| Missing financials (if PM pack was thin) | Financials | Retentions (recompute max SIR); cost vs revenue | Cash, EBITDA, revenue at minimum. |
| Named insured / legal entities | Exposure | Gaps (who is actually covered) | Can live on the binder. |
| Policy period / expiration | Policies | Checklist only unless lapsed | Lapsed claims-made is a terms flag. |
| Years in business | Exposure | Gaps / knockout (retro) | If not on the binder. |
| Headcount / payroll | Exposure | Knockout (WC); WC limit context | |
| Locations count | Exposure | Property / WC by state (clinic, field) | |
| PHI or customer data? (Y/N) | Exposure | Knockout (cyber); cyber floor | |
| Highest customer / landlord insurance exhibit | Contract | Limits (raises floor); compliance | Not a PM field. |

---

## Clinic template extra

Examples: Northbay; home health / pediatric / imaging as cousins.

| Intake item | Scoring category |
| --- | --- |
| Professional / malpractice binder | Limits; knockout if missing |
| Abuse & molestation (SAM) evidence | Gaps / required line |
| Cyber binder with **insuring-agreement grid** (not just the $ aggregate) | Limits; gaps (SE sublimit, BI wait) |
| D&O binder (Side A/B/C, retro) | Limits |
| WC EMR | Loss history |
| Statement of values / clinic list by state | Limits (property); multi-state WC gap |
| Hired/non-owned auto if no fleet | Required line / knockout if vehicles in use |

---

## Field + software template extra

Example: Halcyon Device Services.

| Intake item | Scoring category |
| --- | --- |
| Auto or HNOA binder; vehicle schedule if owned fleet | Limits; knockout if vehicles and no auto |
| Inland marine / tools (and care/custody of customer equipment) | Limits; gaps if per-item sublimit < actual kit |
| Tech E&O binder | Limits; gaps if GL has professional exclusion and no E&O |
| Cyber binder (full grid) | Limits; gaps (SE, BI) |
| D&O binder | Limits |
| Hospital / GPO / school insurance exhibit | Limits (contract-max); compliance (AI / PNC / waiver, $1M EL) |
| WC EMR | Loss history |
| Umbrella schedule of underlying | Knockout if tower hole; gaps if HNOA/products not listed |

---

## SaaS / AI template extra

Examples: Emberline; ScholarLoop, Sendwell, TallyPort, Claymore Systems.

| Intake item | Scoring category |
| --- | --- |
| Tech E&O binder (claims-made, retro, defense inside limits) | Limits (economic line) |
| Cyber binder with SE / funds-transfer sublimits and BI wait | Limits; gaps (headline $5M ≠ payable) |
| Crime binder (or cyber crime section) | Limits; gaps vs largest typical wire |
| D&O binder | Limits |
| Enterprise MSA insurance exhibit | Limits (E&O/cyber contract-max); compliance. Umbrella exhibit is a checkbox, not a substitute for cyber. |
| Largest typical wire / AP run ($) | Gaps (SE sublimit test) |
| HNOA if the MSA requires it | Required line if exhibit says so |

---

## What does **not** belong on CFO intake

- The 0–100 or letter
- Peer comparison
- PM override of appetite (that stays on the manager login)
- Re-picking the industry template (PM already did)

---

## After intake: how the company-specific rubric is assembled

1. Start from template floors + derived max SIR (from PM financials, refreshed if CFO sent better numbers).
2. Raise any limit floor to the **highest exhibit** the CFO uploaded.
3. Turn on template-required lines; add exhibit-required lines (e.g. MSA demands HNOA).
4. Map each extracted policy field into the scoring categories in the first table.
5. Run knockouts. Compute 0–100. Cap the letter if needed.
6. PM sees the card. CFO still only sees missing items.

---

## File vs typed field

Every Tier 1 item is one of three things. The distinction matters because of the rule underneath it.

**A typed number is accepted, but it scores as unverified until a file backs it.** The CFO is never blocked on a missing PDF — they can type the number and move on — but the report card marks the input as unsupported, and the PM sees which figures rest on someone's memory. This is what stops the intake from becoming a self-report.

| Intake item | How | Backing file that verifies it |
| --- | --- | --- |
| Binders / dec pages / schedule of insurance | **Upload** | — (this *is* the evidence) |
| Loss runs | **Upload**, or signed attestation if under two years old | — |
| Missing financials | **Upload** | — |
| Customer / landlord insurance exhibit | **Upload** | — |
| WC EMR | **Type-in + upload** | NCCI / state bureau worksheet |
| Total insured value | **Type-in**, or upload | Statement of values |
| Named insured / legal entities | **Type-in** | Usually already on the binder — extract confirms |
| Policy period / expiration | **Extracted** | Binder |
| Years in business | **Type-in** | Formation docs, if ever disputed |
| Headcount / payroll | **Type-in** | WC audit or payroll register |
| Locations count | **Type-in** | Statement of values |
| Vehicles in use | **Type-in** | Auto schedule on the binder |
| PHI / customer data | **Y/N toggle** | — (drives a knockout, not a limit) |
| Largest typical wire / AP run | **Type-in** | — |

Extracted fields beat typed fields. If the CFO types a $2M cyber limit and the binder says $1M, the binder wins and the mismatch is a flag.

---

## First year with no loss runs

Resolved: **a yellow, not a pass and not a red.**

| Situation | Treatment |
| --- | --- |
| Under 24 months old, signed attestation on file | Yellow. Claims evidence is partial, flagged as "no history yet," not penalized as concealment. |
| Under 24 months old, no attestation | Red. Same as any other missing document. |
| 24 months or older, no loss runs | Red. Unverified claims history — this is the common case and it is never benign. |
| Loss runs older than 90 days | Yellow. Ask for a refresh; reserves move. |

The attestation is a **signed statement of no known losses or circumstances**, not a checkbox. It is a representation a carrier will rely on at the next renewal, and it costs nothing to collect properly now.

---

## What triggers Tier 2

Tier 1 grades everyone. Tier 2 fires on any one of:

- Any knockout triggered
- Any scoring category below 60% of its maximum
- Letter of C or below
- Document completeness below 60% of the required set
- Company inside 12 months of a planned exit

Tier 3 fires on exit prep, or when the PM flags a company for a full program rebuild.

---

## CFO checklist wording

What the company portal actually says. Plain language, no jargon where it can be avoided, and **no grade language anywhere** — the CFO never learns there is a letter.

### Every template

| Item | Portal copy |
| --- | --- |
| Binders / dec pages / SOI | **Your current insurance policies.** One PDF per policy is fine, or a single schedule of insurance if your broker keeps one. We need the binders or declarations pages in force today — not last year's, and not the broker's renewal proposal. |
| Loss runs | **Claims history, last 5 years.** Ask your broker for "loss runs" — carrier-produced, on carrier letterhead. If the company is under two years old, use the no-loss attestation instead. |
| Financials | **Financial statements**, if your PM did not already send them. Income statement, balance sheet. |
| Named insured | **Every legal entity that should be covered** — the parent, all subsidiaries, and anything acquired or formed in the last two years. |
| Years in business | **When the business started operating.** Not when the current owners bought it. |
| Headcount / payroll | **Employee count and annual payroll**, by state if you operate in more than one. |
| Locations | **How many locations you operate**, and where. |
| Vehicles | **Vehicles the company owns or leases.** Enter 0 if employees only drive their own cars for work — but say so, because that is its own coverage. |
| PHI / customer data | **Do you hold patient records or customer data?** |
| Contract exhibit | **The insurance requirements from your largest customer or landlord contract.** Usually a one-page exhibit titled "Insurance." Send the strictest one you have. |

### Clinic template

| Item | Portal copy |
| --- | --- |
| Professional / malpractice binder | **Your malpractice policy.** Include the provider schedule if it is a separate page. |
| Abuse & molestation | **Evidence that abuse and molestation is covered** — the endorsement, or the page of the policy where it appears. If you cannot find it, say so; that is a useful answer. |
| Cyber binder | **Your cyber policy, in full.** We need the page listing each coverage and its own limit, not just the headline number on the cover. |
| D&O binder | **Your directors & officers policy.** |
| WC EMR | **Your workers comp experience modifier**, and the worksheet from NCCI or your state bureau if you have it. |
| Statement of values / clinic list | **A list of your clinics** with addresses, and the insured value of each if you have it. |
| HNOA | **If staff drive personal vehicles for work**, the hired and non-owned auto coverage. |

### Field + software template

| Item | Portal copy |
| --- | --- |
| Auto / vehicle schedule | **Your commercial auto policy and the list of vehicles on it.** |
| Inland marine / tools | **Coverage for tools, test equipment, and any customer equipment in your care.** Include the per-item limit. |
| Tech E&O | **Your technology errors & omissions policy.** |
| Cyber binder | **Your cyber policy, in full** — the page listing each coverage and its own limit. |
| D&O binder | **Your directors & officers policy.** |
| Hospital / GPO / school exhibit | **The insurance requirements from your largest customer contract.** Hospital and health system agreements usually have the strictest ones — send those. |
| WC EMR | **Your workers comp experience modifier**, with the bureau worksheet if you have it. |
| Umbrella schedule of underlying | **The page of your umbrella policy that lists which policies sit beneath it.** |

### SaaS / AI template

| Item | Portal copy |
| --- | --- |
| Tech E&O | **Your technology errors & omissions policy.** Include the retroactive date — it is usually on the declarations page. |
| Cyber binder | **Your cyber policy, in full.** We need the coverage-by-coverage page, including the funds transfer and social engineering limits and the waiting period before business interruption starts. |
| Crime | **Crime or fidelity coverage**, if you carry it separately from cyber. |
| D&O binder | **Your directors & officers policy.** |
| Enterprise MSA exhibit | **The insurance exhibit from your largest customer agreement.** |
| Largest typical wire | **The size of your largest routine wire or AP run.** |
| HNOA | **If a customer contract requires hired and non-owned auto**, the coverage that satisfies it. |

Missing-item copy is the same line, prefixed **"Still needed:"**. Received items show the filename and upload date, nothing else.

---

# Appendix — the full underwriting intake universe

Everything above is **Tier 1**: what the CFO uploads on the shared URL, and all that is needed to produce a letter. This appendix is the complete field universe an underwriter or diligence team would work from. It is **not** a CFO ask — sending it would guarantee a non-response.

| Tier | Roughly | Who collects | When it fires |
| --- | --- | --- | --- |
| **Tier 1** | ~40 fields | CFO, via the shared URL | Every company, every cycle. The list above. |
| **Tier 2** | ~90 fields | Broker / analyst, from the actual policies | Bottom-quartile companies, any knockout, or any pillar scoring below ~60 |
| **Tier 3** | ~120 fields | Analyst + portco ops | Exit prep, or a company the PM flags for a full program rebuild |

Grade Tier 1 across the whole portfolio, then go deep only where Tier 1 flags. Full collection on 18 companies is a project, not a report card.

---

## A. Entity & corporate structure

*Feeds: Gaps and weak terms.*

- Legal name of **every** entity — parent, subsidiaries, DBAs, dormant, newly formed, PCs / MSOs
- FEINs; state of domicile; all states of operation
- Ownership %, JVs, minority stakes, management companies
- Acquisitions during the policy period — closing dates, and whether the "newly acquired or formed" auto-coverage window (usually 90 days) actually caught them
- Divestitures and discontinued operations
- Predecessor entities and whether prior-acts coverage follows them
- Board composition, PE sponsor seats, independent directors, indemnification agreements
- ERISA plan sponsor entity
- Fiscal year end, audit firm, debt schedule, covenant status
- Pending M&A activity

> This is where most portfolio companies fail quietly. An entity acquired 14 months ago that never made it onto the named insured schedule has been uninsured the entire time.

---

## B. Exposure data by line

*Feeds: Limit adequacy, Gaps, Premium vs peers.*

### Workers Compensation

- Payroll by state × NCCI / state class code — by code, not blended
- FTE / PT / seasonal headcount by state
- Officers included or excluded; officer payroll caps
- **Experience Mod worksheet** (NCCI or state bureau), current + 3 prior — the worksheet, not just the number
- 1099 contractors: count, and reclassification risk
- Subcontractors used **without** certificates on file — charged as your payroll at audit
- Remote workers by state — WC jurisdiction follows where the work is performed
- Volunteers
- USL&H / Jones Act / FELA exposure
- Monopolistic state operations (OH, WA, WY, ND)
- Large deductible / retro program terms if applicable

### General Liability

- Gross revenue by state and operation type
- Products revenue vs. services revenue — separate aggregate
- Square footage by location
- Patient visits / admissions / foot traffic
- Subcontracted work volume; sub limits and hold-harmless language
- Premises owned vs. leased
- Special events, athletic / physical activity, liquor, firearms / security exposure

### Property

- Full location schedule: address, occupancy, **construction class (ISO)**, year built, stories, sq ft, protection class, sprinklered Y/N, roof age & type, alarm / central station
- Building replacement cost — not book value — plus BPP / contents, tenant improvements & betterments
- **Business income worksheet** with stated period of restoration
- High-value equipment schedule with replacement cost (MRI, CT, lab, field service inventory)
- Stock / inventory: peak vs. average
- EDP / electronic equipment; property off-premises and in transit
- Flood zone, wind / hail zone, seismic — and for DFW, hail is the loss driver, not fire
- Prior COPE reports / carrier engineering surveys
- Lease insurance & indemnity obligations per location

### Auto

- Vehicle schedule: VIN, year / make / model, GVW class, garaging address, radius, owned / leased / financed
- Driver list: name, DOB, license number & state, hire date, MVR status
- MVR pull frequency and written driver qualification standards
- Annual rental / hired auto spend
- **Non-owned auto: count of employees driving personal vehicles for business** — the single most under-scoped exposure in home health and multi-site clinic models
- Telematics / dashcam deployment
- DOT number, CSA BASIC scores, ISS score if applicable
- Cargo values

### Professional Liability / Medical Malpractice

- Provider roster: name, license #, specialty, FTE %, **employed vs. IC vs. locum**, state, board certification, hire date
- Patient encounters per year by service line and location
- Scope of services actually performed at each site — not what the website says
- Telehealth volume and states licensed
- Supervision structure — physician oversight of NPs / PAs, licensed clinician oversight of techs
- Credentialing and privileging process documentation
- Any provider with prior claims, license actions, or NPDB reports
- Corporate practice of medicine structure (MSO / PC split)
- Prior carrier and **retro date per provider** — not per policy

### Cyber / Technology E&O

- Record counts: PII, PHI, PCI
- ARR; revenue derived from software or platform
- RTO / RPO; hours of downtime tolerable before material loss
- Security control attestation: MFA coverage % and on what (email, VPN, privileged accounts), EDR / MDR, backup architecture — immutable? offline? **date of last tested restore** — PAM, email filtering, patch cadence, EOL systems inventory, network segmentation, security awareness training completion %
- Prior incidents: ransomware, BEC, data loss — including ones that never became claims
- Third-party dependencies and single points of failure (EHR vendor, PBM, billing clearinghouse)
- Cloud providers and shared-responsibility boundaries
- **AI / ML use**: models deployed, training data provenance, and whether outputs influence decisions about people
- SOC 2 / HITRUST / ISO 27001 status and date
- BAAs and contractual data protection obligations

### D&O / Management Liability

- Total assets, revenue, EBITDA, debt schedule, covenant headroom, cash runway
- Charter / bylaw indemnification provisions
- Prior and pending litigation, regulatory inquiries, SEC / DOJ / OIG / state AG matters
- Antitrust and IP litigation exposure
- Securities issuances, Reg D offerings, planned liquidity events
- Whether the sponsor needs outside-directorship or Side A coverage

### EPLI

- Headcount by state, exempt vs. non-exempt
- Turnover rate; involuntary terminations, 3 years
- Pending EEOC / state agency charges; DOL wage-and-hour audits
- **Headcount in CA, NY, IL, NJ, WA** — severity venues. Illinois BIPA specifically if fingerprint timeclocks are in use
- Union status and CBAs
- Employee handbook: date last reviewed by employment counsel
- Arbitration agreements with class action waivers — in place, and enforceable in those states?
- IC classification exposure
- Background check process — FCRA class exposure

### Crime / Fidelity

- Monthly disbursements; largest single wire
- Number of employees with payment authorization
- Segregation of duties; dual authorization thresholds
- **Wire verification / callback procedure** — determines whether social engineering coverage is even available
- Cash handling at locations; vendor master file change controls

### Fiduciary / ERISA

- Plan names, plan assets, participant counts, 5500 filings
- ERISA fidelity bond amount — 10% of plan assets, $1K–$500K, or $1M with employer securities
- Investment committee minutes, IPS, fee benchmarking date

### Environmental

- Site history; Phase I / Phase II ESAs on owned real estate
- USTs / ASTs
- Hazardous materials; **medical and biohazard waste, sharps** — often overlooked at clinic networks
- Transportation of regulated waste
- Mold / Legionella / indoor air quality history

### Other

- Foreign operations, foreign travel, expatriates (DBA / FVL)
- Owned or non-owned aircraft and watercraft
- Product recall exposure
- IP portfolio
- Receivables concentration

---

## C. Policy inventory — fields to extract per line

*Feeds: Limit adequacy, Deductibles / SIRs, Carrier quality, Premium vs peers.*

Get the **full policy**, not the dec page. These are the fields the engine needs:

| Field group | Detail |
| --- | --- |
| Identity | Line, exact named insured string, additional named insureds, policy number |
| Carrier | Legal underwriting entity, AM Best rating + financial size category, admitted vs. surplus lines |
| Term | Inception, expiration, occurrence vs. claims-made, **retro date, prior acts, continuity date** |
| Limits | Per occurrence / claim, general aggregate, products-completed ops aggregate, per-location / project aggregate |
| Sublimits | Every one, itemized |
| Retention | Deductible vs. SIR, per occurrence vs. per claim, aggregate stop-loss, corridor |
| Defense | Inside or outside limits, duty to defend vs. indemnity-only, consent to settle / hammer clause % |
| Premium | Written premium, TRIA, taxes / surplus lines tax / fees, commission vs. fee, min & deposit, auditable Y/N, rate and exposure base |
| Property terms | Coinsurance %, valuation (RC / ACV / agreed value), margin clause, named windstorm & hail deductible basis |
| Excess | Attachment point, schedule of underlying, follow-form or own form, drop-down provisions, maintenance deductible |
| Legal | Coverage territory, choice of law, arbitration / service of suit, cancellation notice provisions |

Lines to inventory — **absence is itself a finding**: WC / EL · GL · Property · Auto · Umbrella / Excess · Med Mal or Allied Health Professional · Miscellaneous E&O · Technology E&O · Cyber · D&O (Sides A/B/C) · EPLI · Fiduciary · Crime · Pollution / Environmental · Equipment Breakdown · Inland Marine · Cargo · Surety bonds · Foreign package · Product recall · K&R · Standalone terrorism · Active assailant · Employed lawyers · Aviation / Watercraft · Builders risk · Rep & Warranty.

---

## D. Endorsements & forms — where programs actually fail

*Feeds: Gaps and weak terms, Contract / COI compliance.*

Get the **complete schedule of forms with edition dates** per policy. Then specifically confirm:

### Contractual risk transfer

- Additional insured, ongoing ops (CG 20 10) **and** completed ops (CG 20 37) — blanket-by-contract vs. scheduled, and **edition date**: the 2013 edition caps AI status at the lesser of the contract requirement or the policy limit; the 2004 edition doesn't
- Primary & non-contributory endorsement
- Waiver of subrogation — blanket vs. scheduled, on both GL and WC
- Notice of cancellation to additional insureds
- Contractual liability exclusion and the "insured contract" definition

### Structure

- Per-location / per-project aggregate (CG 25 04 / CG 25 03) — a blanket aggregate across 50 clinics is a real gap
- Amendment of named insured; newly acquired entity auto-coverage window
- Anti-stacking / non-cumulation
- Extended reporting period terms: length available, **cost as % of expiring premium**, trigger, election deadline

### Healthcare-specific

- **Sexual abuse & molestation** — covered or excluded; if covered, the limit, whether sublimited, defense treatment, occurrence vs. claims-made, and **whether the umbrella follows** (it frequently doesn't)
- Professional services exclusion on GL, and whether E&O actually picks up what it drops
- Telemedicine endorsement and its state schedule
- Errors in dispensing
- Communicable disease exclusion
- Employee benefits liability

### Tech / cyber

- Cyber & data exclusions on GL and Property (CG 21 06 / CG 21 07)
- War and cyberwar exclusions (LMA 5564 / 5566 series)
- Widespread event / systemic risk endorsement
- Ransomware sublimit or coinsurance
- Media and IP infringement grant on tech E&O — or its exclusion
- Bodily injury / property damage carve-back on tech E&O
- Regulatory defense, fines & penalties — and insurability by state
- **Affirmative AI / algorithmic output exclusion** — ask for this by name; it started appearing on E&O forms in 2024 and most insureds don't know it's there

### Employment

- Wage & hour: sublimit, and whether it's defense-only
- Third-party EPLI — patient / customer harassment of employees, and vice versa
- **Biometric information / BIPA exclusion** on GL and EPLI
- Employment-related practices exclusion on GL

### Management liability

- Insured vs. insured / cross-suits exclusion and its carve-backs
- Bankruptcy and creditor exclusions; major shareholder exclusion
- Side A DIC presence

### Property

- Protective safeguards warranty (sprinkler / alarm) — breach voids the loss
- Roof surfacing ACV endorsement; cosmetic damage exclusion
- Ordinance or law A / B / C
- Equipment breakdown limit — and whether **cryogen / helium loss** is included, for imaging
- Absolute pollution exclusion and any hostile-fire or BI carve-backs

### Wildcards

- Any **manuscript endorsement** — non-standard wording is where the surprises live
- Nuclear, asbestos, lead, silica exclusions

---

## E. Loss data

*Feeds: Loss history.*

- **Carrier-produced loss runs on carrier letterhead**, 5 years minimum — 7 for claims-made and long-tail — valued within 90 days. Not a broker summary.
- Per claim: date of loss, **date reported**, claimant, description, cause code, status, paid indemnity, paid expense, outstanding reserve, total incurred, recoveries / subrogation, litigation status
- **Lag time** (DOL to report) — a direct severity driver and a cheap thing to fix
- **Development triangles**: the same claims valued at 12 / 24 / 36 / 48 / 60 months, to see reserve movement
- Large loss narratives for anything above 25% of the primary limit
- Open reserves with defense counsel's assessment
- Reservation of rights letters, denials, declinations
- Claims in the current period not yet on a loss run
- **Circumstances / potential claims noticed but not yet claims** — critical for claims-made continuity at renewal and at exit
- Third-party litigation never tendered to insurance
- OSHA 300 / 300A logs, TRIR / DART, 3 years
- Auto accident register including non-claim incidents
- EEOC / DOL / OSHA citation history
- Root cause and corrective action documentation

---

## F. Contractual & compliance

*Feeds: Contract / COI compliance, Limit adequacy (contract-max floors).*

- Insurance requirement clauses from the **top 10–20 customer contracts** — and for the healthcare portcos, hospital and health system agreements specifically, which carry the harshest indemnity terms
- Payer contracts and BAAs
- Insurance and indemnity sections of **every** real property lease
- Minimum insurance requirements imposed on vendors and subcontractors
- Inbound COI file, tracking system, and **% compliance**
- Certificate issuance process and turnaround
- Loan and credit agreement insurance covenants; lender loss payee and mortgagee clauses
- Equipment lease / finance insurance requirements
- State licensure and statutory bond requirements
- Franchise / DSO / MSO agreement requirements

---

## G. Cost & broker

*Feeds: Premium vs peers. Broker service is not currently a scored category — see open items.*

- Premium by line, 3–5 year history
- Taxes, fees, surplus lines tax, TRIA, broker fees
- Loss funds, paid loss deposits, **collateral** (LOCs, cash, surety) and the cost of the issuing facility
- TPA and claim handling fees, allocated vs. unallocated
- Internal risk management cost
- Retained and uninsured losses actually paid

> These assemble into **TCOR** — the only cost metric comparable across the portfolio. Premium alone understates a high-retention program and flatters a bad one.

- Premium audit results, 3 years, and any open audit balances
- Broker of record letter and appointment date
- **Broker compensation**: commission %, contingent and supplemental commissions, fee agreements, wholesale / MGA compensation
- Marketing history: markets approached, dates, quotes vs. declinations **with reasons for declination**
- Renewal timeline; stewardship reports; benchmarking previously provided
- Service team roster and named claims advocate
- Premium finance arrangements and rate

---

## H. Risk control & operations

*Feeds: Loss history (forward-looking). Not scored today — see open items.*

- Written safety program with last revision date
- Return-to-work / modified duty program and its utilization rate
- Driver qualification and MVR policy
- Incident reporting process and time-to-report metrics
- Hiring and background check process
- **Chaperone policy** — the first question any abuse underwriter asks a hands-on care provider
- Patient / client abuse reporting and training records
- HIPAA privacy and security officer; date of last security risk assessment
- Business continuity / DR plan and **date last tested**
- Vendor risk management program
- Workplace violence / active assailant policy
- Training completion rates

---

## I. Exit-specific

*Fires only on exit prep. Not part of the 0–100.*

- Inventory of every claims-made line with **quoted tail / ERP cost** and election window
- D&O run-off quote — 6 years is market standard, and it is a real budget line at close
- Loss run completeness across **all carriers ever on risk**, not just incumbents
- Known claims and circumstances that will become R&W policy exclusions
- **Archive of historical occurrence policies** — they still respond years later, and most companies can't produce them
- Predecessor entity coverage
- Change of control and assignment clauses per policy
- Collateral release schedule and negotiation status
- Any coverage dispute, ROR, or carrier litigation
- Environmental liability at owned real estate
- Benefit plan runout liability if self-funded

---

## J. Employee benefits — only if in scope

*Currently out of scope. At $20–50M revenue with heavy headcount, benefits spend often runs 3–5× P&C.*

- Funding: fully insured / level-funded / self-funded
- Enrolled lives, tier mix, dependent ratio
- Total cost PEPY and PMPM, employer vs. employee share
- Stop-loss: specific deductible, aggregate corridor, **lasers**, contract basis (12/12, 12/15, paid)
- Large claimants above 50% of spec, with prognosis
- Rx spend, specialty %, PBM contract terms and rebate flow
- Network, TPA / ASO fees
- Renewal and trend history
- Compliance: ACA reporting, 5500s, SBC / SPD currency, COBRA admin, CAA Rx transparency, gag clause attestation
- **Consultant compensation disclosure (CAA §202)**

---

## Still to specify

Resolved above: checklist wording per template, first-year / no loss runs, file vs typed field, Tier 2 trigger.

Still open — all four are **scoring-model** decisions, so they belong in [planning.md](planning.md) rather than here. Recommendation attached to each.

- **Data completeness.** If a company can't produce loss runs or a named insured schedule, that is itself a finding — arguably the most predictive one for exit readiness. *Recommend: don't add a pillar. Instead make withheld inputs score as unverified rather than clean inside the pillars they already touch, and surface a provisional marker on the card. Restructuring the 100 is not worth it; closing the incentive to withhold is.*
- **Broker service (G) and risk control (H).** Neither is in the 100 today. *Recommend: leave both out. They are the two most gameable categories on the list — every broker says they market the program — and neither survives contact with a self-report. Keep them as narrative findings.*
- **Premium vs TCOR.** The cost pillar prices premium against revenue, but section G collects the components of TCOR. *Recommend: pick one. Premium-only is defensible at this size and most of G can go; TCOR is the better metric but needs collateral, TPA fees, and retained losses at Tier 1, which is a real ask.*
- **Benefits (J).** Out of scope today. *Recommend: keep it out for v1 and revisit for the clinic and home-health names, where it is the larger spend.*
