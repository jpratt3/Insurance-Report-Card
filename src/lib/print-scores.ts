import { seedCompanies } from "./seed-data";
import { scoreCompany } from "./score";

for (const c of seedCompanies()) {
  const s = scoreCompany(c);
  console.log(`${c.name}\t${s.rawTotal}\t${s.letterFromMath}->${s.letter}\tKO ${s.knockoutCount}`);
}
