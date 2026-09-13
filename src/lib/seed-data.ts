import { defaultGoalsFor } from "./rubric";
import type {
  Company,
  CompanyStatus,
  DocumentType,
  Exposures,
  PolicyLine,
  PolicyLineType,
  UploadedDocument,
} from "./types";

let n = 0;
function pid(): string {
  n += 1;
  return `p${n}`;
}

function line(
  type: PolicyLineType,
  occ: number,
  extra: Partial<PolicyLine> = {},
): PolicyLine {
  return {
    id: pid(),
    line: type,
    carrier: extra.carrier ?? "Chubb",
    amBest: extra.amBest ?? "A++",
    limitOccurrence: occ,
    limitAggregate: extra.limitAggregate ?? occ,
    retention: extra.retention ?? 10_000,
    premium: extra.premium ?? Math.round(occ * 0.004),
    retroDate: extra.retroDate ?? null,
    waitingHours: extra.waitingHours ?? null,
    socialEngineeringLimit: extra.socialEngineeringLimit ?? null,
    additionalInsured: extra.additionalInsured ?? true,
    primaryNonContributory: extra.primaryNonContributory ?? true,
    waiverSubrogation: extra.waiverSubrogation ?? true,
    attachesOver: extra.attachesOver ?? [],
    umbrellaGap: extra.umbrellaGap ?? false,
    notes: extra.notes ?? "SAMPLE",
  };
}

function docs(types: DocumentType[], prefix: string): UploadedDocument[] {
  return types.map((type, i) => ({
    id: `${prefix}-d${i}`,
    type,
    filename: `SAMPLE-${type}.pdf`,
    storedPath: "",
    uploadedAt: "2026-01-15T12:00:00.000Z",
    extractConfidence: 0.9,
    extractNotes: "Seeded SAMPLE — not a live policy.",
  }));
}

function exp(p: Partial<Exposures>): Exposures {
  return {
    revenue: 30_000_000,
    payroll: 12_000_000,
    employees: 180,
    locations: 6,
    vehicles: 0,
    tiv: 3_000_000,
    hasPhi: false,
    hasCustomerData: true,
    cash: 3_000_000,
    maxDeductible: 50_000,
    contractMinUmbrella: 5_000_000,
    contractMinCyber: 2_000_000,
    contractMinEo: 0,
    largestWire: 400_000,
    yearsInBusiness: 8,
    emr: 0.95,
    ebitda: 4_500_000,
    notes: "SAMPLE exposures",
    ...p,
  };
}

export function seedCompanies(): Company[] {
  n = 0;
  const northbay: Company = {
    id: "northbay",
    name: "Northbay Functional Health",
    status: "Active",
    partnered: "2018",
    sector: "Functional Health",
    hq: "Columbus, OH",
    leadership: "—",
    archetype: "clinics",
    sample: true,
    exposures: exp({
      revenue: 42_000_000,
      employees: 420,
      payroll: 22_000_000,
      locations: 36,
      tiv: 9_000_000,
      hasPhi: true,
      vehicles: 4,
      emr: 1.08,
      yearsInBusiness: 8,
    }),
    goals: defaultGoalsFor("clinics"),
    documents: docs(
      ["schedule_of_insurance", "binder_or_dec", "loss_runs", "professional_binder", "cyber_binder", "do_binder", "sov", "contract_exhibit", "wc_emr"],
      "northbay",
    ),
    policies: [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 86000 }),
      line("hnoa", 1_000_000, { premium: 12000 }),
      line("wc", 1_000_000, { premium: 210000 }),
      line("umbrella", 5_000_000, { premium: 48000, attachesOver: ["gl", "hnoa", "wc"] }),
      line("professional", 1_000_000, { limitAggregate: 3_000_000, premium: 190000, retroDate: "2018-01-01" }),
      line("abuse", 1_000_000, { limitAggregate: 2_000_000, premium: 22000 }),
      line("cyber", 2_000_000, { premium: 64000, retroDate: "2018-01-01", waitingHours: 12, socialEngineeringLimit: 250_000 }),
      line("do", 5_000_000, { premium: 41000, retroDate: "2018-01-01" }),
      line("epli", 2_000_000, { premium: 28000 }),
      line("property", 9_000_000, { premium: 54000 }),
    ],
  };

  const halcyon: Company = {
    id: "halcyon",
    name: "Halcyon Device Services",
    status: "Active",
    partnered: "2018",
    sector: "Healthcare equipment",
    hq: "Columbus, OH",
    leadership: "—",
    archetype: "field_software",
    sample: true,
    exposures: exp({
      revenue: 38_000_000,
      employees: 210,
      vehicles: 42,
      hasPhi: true,
      contractMinUmbrella: 10_000_000,
      contractMinEo: 2_000_000,
      largestWire: 750_000,
      emr: 1.18,
    }),
    goals: defaultGoalsFor("field_software"),
    documents: docs(["schedule_of_insurance", "binder_or_dec", "loss_runs", "cyber_binder", "do_binder", "wc_emr"], "halcyon"),
    policies: [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 72000 }),
      line("auto", 1_000_000, { premium: 156000 }),
      line("wc", 1_000_000, { premium: 188000 }),
      line("umbrella", 5_000_000, { premium: 62000, attachesOver: ["gl", "auto", "wc"] }),
      line("inland_marine", 150_000, { premium: 9000 }),
      line("tech_eo", 2_000_000, { premium: 48000, retroDate: "2018-01-01" }),
      line("cyber", 2_000_000, { premium: 51000, retroDate: "2018-01-01", waitingHours: 24, socialEngineeringLimit: 100_000 }),
      line("do", 5_000_000, { premium: 36000, retroDate: "2018-01-01" }),
      line("crime", 1_000_000, { premium: 11000, socialEngineeringLimit: 100_000 }),
    ],
  };

  const emberline: Company = {
    id: "emberline",
    name: "Emberline Analytics",
    status: "Active",
    partnered: "2025",
    sector: "Artificial Intelligence",
    hq: "—",
    leadership: "—",
    archetype: "saas",
    sample: true,
    exposures: exp({
      revenue: 8_000_000,
      employees: 28,
      payroll: 3_200_000,
      locations: 1,
      tiv: 200_000,
      cash: 4_500_000,
      hasPhi: false,
      yearsInBusiness: 2,
      contractMinUmbrella: 1_000_000,
      contractMinCyber: 5_000_000,
      contractMinEo: 5_000_000,
      emr: 0.88,
      largestWire: 900_000,
    }),
    goals: defaultGoalsFor("saas"),
    documents: docs(["cyber_binder", "do_binder"], "emberline"),
    policies: [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 4200 }),
      line("hnoa", 1_000_000, { premium: 1500 }),
      line("wc", 1_000_000, { premium: 9800 }),
      line("umbrella", 1_000_000, { premium: 3200 }),
      line("tech_eo", 2_000_000, { premium: 28000, retroDate: "2025-01-01" }),
      line("cyber", 2_000_000, { premium: 31000, retroDate: "2025-01-01", waitingHours: 48, socialEngineeringLimit: 50_000 }),
      line("do", 1_000_000, { premium: 14000, retroDate: "2025-01-01" }),
      line("crime", 250_000, { premium: 2200, socialEngineeringLimit: 50_000 }),
    ],
  };

  return [
    northbay,
    halcyon,
    emberline,
    named("lantern", "Lantern Relief Alliance", "Give-Back", "2016", "Hunger relief", "Columbus, OH", "—", "nonprofit", exp({ revenue: 4_000_000, employees: 18, locations: 2, hasCustomerData: false, contractMinUmbrella: 1_000_000, contractMinCyber: 1_000_000, emr: 0.91, yearsInBusiness: 6 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 7800 }),
      line("hnoa", 1_000_000, { premium: 2100 }),
      line("wc", 1_000_000, { premium: 6400 }),
      line("do", 2_000_000, { premium: 6200, retroDate: "2016-01-01" }),
      line("cyber", 1_000_000, { premium: 4100, retroDate: "2022-01-01", waitingHours: 12, socialEngineeringLimit: 250_000 }),
    ], ["schedule_of_insurance", "binder_or_dec", "loss_runs", "do_binder", "cyber_binder"]),
    named("stillwater", "Stillwater Holdings", "Realized", "2021", "SPAC", "Columbus, OH", "—", "holdco", exp({ revenue: 0, employees: 6, locations: 1, tiv: 50_000, hasCustomerData: false, contractMinUmbrella: 0, contractMinCyber: 0, emr: null, yearsInBusiness: 5 }), [
      line("do", 10_000_000, { premium: 185000, carrier: "AIG", amBest: "A", retroDate: "2021-01-01" }),
      line("epli", 2_000_000, { premium: 22000 }),
      line("crime", 5_000_000, { premium: 18000 }),
    ], ["binder_or_dec", "do_binder", "loss_runs"]),
    named("cedarpath", "Cedarpath Home Care", "Realized", "2011", "Home health", "—", "—", "home_health", exp({ revenue: 14_000_000, employees: 190, hasPhi: true, vehicles: 12, emr: 1.41 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 29000, additionalInsured: false }),
      line("wc", 1_000_000, { premium: 260000 }),
      line("professional", 1_000_000, { limitAggregate: 3_000_000, premium: 54000, retroDate: "2014-01-01" }),
      line("cyber", 500_000, { premium: 9000, retroDate: "2022-01-01", waitingHours: 24, socialEngineeringLimit: 50_000 }),
      line("do", 1_000_000, { premium: 11000, retroDate: "2016-01-01" }),
    ], ["binder_or_dec"]),
    named("riverbend", "Riverbend Home Health", "Realized", "2007", "Home health", "Pueblo, CO", "—", "home_health", exp({ revenue: 18_000_000, employees: 260, hasPhi: true, vehicles: 8, emr: 1.24, contractMinUmbrella: 2_000_000, yearsInBusiness: 16 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 41000, additionalInsured: false, primaryNonContributory: false }),
      line("hnoa", 1_000_000, { premium: 19000 }),
      line("wc", 1_000_000, { premium: 310000 }),
      line("umbrella", 2_000_000, { premium: 18000 }),
      line("professional", 1_000_000, { limitAggregate: 3_000_000, premium: 96000, retroDate: "2010-01-01" }),
      line("abuse", 1_000_000, { premium: 14000 }),
      line("cyber", 1_000_000, { premium: 22000, retroDate: "2019-01-01", waitingHours: 12, socialEngineeringLimit: 100_000 }),
      line("do", 3_000_000, { premium: 19000, retroDate: "2012-01-01" }),
    ], ["professional_binder", "loss_runs", "wc_emr", "binder_or_dec", "schedule_of_insurance"]),
    named("vantage", "Vantage Imaging Partners", "Realized", "2012", "Healthcare imaging", "Tulsa, OK", "—", "imaging", exp({ revenue: 28_000_000, employees: 95, locations: 5, tiv: 18_000_000, hasPhi: true, contractMinUmbrella: 10_000_000, contractMinCyber: 3_000_000 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 33000 }),
      line("hnoa", 1_000_000, { premium: 4000 }),
      line("wc", 1_000_000, { premium: 42000 }),
      line("umbrella", 10_000_000, { premium: 39000, attachesOver: ["gl", "hnoa", "wc"] }),
      line("professional", 1_000_000, { limitAggregate: 3_000_000, premium: 210000, retroDate: "2012-01-01" }),
      line("property", 18_000_000, { premium: 88000 }),
      line("cyber", 5_000_000, { premium: 72000, retroDate: "2016-01-01", waitingHours: 8, socialEngineeringLimit: 250_000 }),
      line("do", 5_000_000, { premium: 27000, retroDate: "2012-01-01" }),
    ], ["schedule_of_insurance", "binder_or_dec", "loss_runs", "professional_binder", "cyber_binder", "do_binder", "sov", "wc_emr"]),
    named("brightleaf", "Brightleaf Pediatric Therapy", "Realized", "2009", "Pediatric therapy", "Ohio", "—", "home_health", exp({ revenue: 24_000_000, employees: 310, hasPhi: true, vehicles: 20, emr: 1.02 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 38000 }),
      line("hnoa", 1_000_000, { premium: 21000 }),
      line("auto", 1_000_000, { premium: 18000 }),
      line("wc", 1_000_000, { premium: 240000 }),
      line("umbrella", 5_000_000, { premium: 22000 }),
      line("professional", 1_000_000, { limitAggregate: 3_000_000, premium: 88000, retroDate: "2009-01-01" }),
      line("abuse", 2_000_000, { limitAggregate: 4_000_000, premium: 31000 }),
      line("cyber", 2_000_000, { premium: 27000, retroDate: "2015-01-01", waitingHours: 12, socialEngineeringLimit: 250_000 }),
      line("do", 5_000_000, { premium: 24000, retroDate: "2011-01-01" }),
    ], ["schedule_of_insurance", "binder_or_dec", "loss_runs", "professional_binder", "cyber_binder", "do_binder", "contract_exhibit", "wc_emr"]),
    named("ironcreek", "Ironcreek Energy Services", "Realized", "2012", "Oil and gas services", "—", "—", "energy", exp({ revenue: 55_000_000, employees: 190, vehicles: 80, hasCustomerData: false, emr: 1.31, contractMinUmbrella: 10_000_000 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 210000, carrier: "Lloyd's", amBest: "A" }),
      line("auto", 1_000_000, { premium: 420000 }),
      line("wc", 1_000_000, { premium: 510000 }),
      line("umbrella", 5_000_000, { premium: 180000, umbrellaGap: true }),
      line("pollution", 1_000_000, { premium: 64000, retroDate: "2012-01-01" }),
      line("do", 5_000_000, { premium: 33000, retroDate: "2012-01-01" }),
    ], ["schedule_of_insurance", "binder_or_dec", "loss_runs", "do_binder", "wc_emr", "sov"]),
    saas("claymore", "Claymore Systems", "2013", "Realized", "Dayton, OH", "ERP integration", "—", 46_000_000, true),
    saas("sendwell", "Sendwell", "2014", "Realized", "—", "MarTech", "—", 22_000_000, false),
    named("scholarloop", "ScholarLoop", "Realized", "2011", "EdTech", "Columbus, OH", "—", "saas", exp({ revenue: 16_000_000, employees: 85, contractMinCyber: 2_000_000, contractMinEo: 2_000_000, yearsInBusiness: 12 }), [
      line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 6200 }),
      line("hnoa", 1_000_000, { premium: 1800 }),
      line("wc", 1_000_000, { premium: 14000 }),
      line("umbrella", 2_000_000, { premium: 4100 }),
      line("tech_eo", 5_000_000, { premium: 41000, retroDate: "2012-01-01" }),
      line("cyber", 5_000_000, { premium: 38000, retroDate: "2014-01-01", waitingHours: 8, socialEngineeringLimit: 250_000 }),
      line("do", 5_000_000, { premium: 22000, retroDate: "2011-01-01" }),
      line("crime", 1_000_000, { premium: 4500, socialEngineeringLimit: 250_000 }),
    ], ["schedule_of_insurance", "binder_or_dec", "loss_runs", "cyber_binder", "do_binder", "contract_exhibit"]),
    saas("tallyport", "TallyPort", "2019", "Realized", "—", "Subscription billing", "—", 31_000_000, true),
  ];
}

function named(
  id: string,
  name: string,
  status: CompanyStatus,
  partnered: string,
  sector: string,
  hq: string,
  leadership: string,
  archetype: Company["archetype"],
  exposures: Exposures,
  policies: PolicyLine[],
  documentTypes: DocumentType[],
): Company {
  return {
    id,
    name,
    status,
    partnered,
    sector,
    hq,
    leadership,
    archetype,
    sample: true,
    exposures,
    goals: defaultGoalsFor(archetype),
    policies,
    documents: docs(documentTypes, id),
  };
}

function saas(
  id: string,
  name: string,
  partnered: string,
  status: CompanyStatus,
  hq: string,
  sector: string,
  leadership: string,
  revenue: number,
  strong: boolean,
): Company {
  return named(
    id,
    name,
    status,
    partnered,
    sector,
    hq,
    leadership,
    "saas",
    exp({
      revenue,
      employees: strong ? 140 : 70,
      contractMinCyber: strong ? 5_000_000 : 1_000_000,
      contractMinEo: strong ? 5_000_000 : 1_000_000,
      yearsInBusiness: 10,
      emr: 0.9,
    }),
    strong
      ? [
          line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 9000 }),
          line("hnoa", 1_000_000, { premium: 2200 }),
          line("wc", 1_000_000, { premium: 18000 }),
          line("umbrella", 5_000_000, { premium: 7000 }),
          line("tech_eo", 5_000_000, { premium: 52000, retroDate: "2014-01-01" }),
          line("cyber", 5_000_000, { premium: 47000, retroDate: "2015-01-01", waitingHours: 8, socialEngineeringLimit: 500_000 }),
          line("do", 5_000_000, { premium: 29000, retroDate: "2013-01-01" }),
          line("crime", 1_000_000, { premium: 6000, socialEngineeringLimit: 250_000 }),
        ]
      : [
          line("gl", 1_000_000, { limitAggregate: 2_000_000, premium: 5000 }),
          line("wc", 1_000_000, { premium: 11000 }),
          line("tech_eo", 1_000_000, { premium: 18000, retroDate: "2016-01-01" }),
          line("cyber", 1_000_000, { premium: 16000, retroDate: "2018-01-01", waitingHours: 24, socialEngineeringLimit: 50_000 }),
          line("do", 2_000_000, { premium: 12000, retroDate: "2015-01-01" }),
        ],
    strong
      ? ["schedule_of_insurance", "binder_or_dec", "loss_runs", "cyber_binder", "do_binder", "contract_exhibit"]
      : ["binder_or_dec"],
  );
}
