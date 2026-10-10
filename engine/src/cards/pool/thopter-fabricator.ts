import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 4217.
const THOPTER =
  "Whenever you draw your second card each turn, create a 1/1 colorless Thopter artifact creature token with flying.";

export default defineCard({
  name: "Thopter Fabricator",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${THOPTER}\nCrew 2`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: THOPTER,
    },
  ],
  activated: [crew(2)],
});
