import { replaceCompanies } from "./db";
import { seedCompanies } from "./seed-data";

replaceCompanies(seedCompanies());
console.log("SAMPLE book loaded. Sign in as pm, or a company id such as northbay.");
