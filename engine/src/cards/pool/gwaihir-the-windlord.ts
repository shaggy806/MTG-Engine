import { defineCard } from "../define.js";

// EDHREC rank 6682.
//
// The reduction is printed on the spell itself (`selfCostReduction`), read
// as it's cast from wherever it's cast — the command zone included — off the
// caster's cards drawn this turn (the `cards-drawn` turn stat).

const REDUCTION_TEXT = "This spell costs {2} less to cast as long as you've drawn two or more cards this turn.";
const LORD_TEXT = "Other Birds you control have vigilance.";

export default defineCard({
  name: "Gwaihir the Windlord",
  manaCost: "{4}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Noble"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: `${REDUCTION_TEXT}\nFlying, vigilance\n${LORD_TEXT}`,
  selfCostReduction: {
    condition: { kind: "turn-stat", stat: "cards-drawn", who: "you", atLeast: 2 },
    reduceGeneric: 2,
  },
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Bird", excludeSelf: true },
      grantKeywords: ["vigilance"],
      text: LORD_TEXT,
    },
  ],
});
