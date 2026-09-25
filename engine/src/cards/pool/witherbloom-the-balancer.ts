import { defineCard } from "../define.js";
import { affinity, grantAffinity } from "../helpers.js";

// #116 in top-commanders.txt.
const GRANT_TEXT = "Instant and sorcery spells you cast have affinity for creatures.";

export default defineCard({
  name: "Witherbloom, the Balancer",
  manaCost: "{6}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "deathtouch"],
  selfCostReduction: affinity({ type: "creature" }),
  text:
    "Affinity for creatures (This spell costs {1} less to cast for each creature you control.)\n" +
    `Flying, deathtouch\n${GRANT_TEXT}`,
  static: [grantAffinity({ typesAnyOf: ["instant", "sorcery"] }, { type: "creature" }, GRANT_TEXT)],
});
