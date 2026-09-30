import { defineCard } from "../define.js";

const ATTACK_TEXT = "Gadrak can't attack unless you control four or more artifacts.";
const TREASURE_TEXT =
  "At the beginning of your end step, create a Treasure token for each nontoken creature that died this turn. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";

// Every nontoken creature that died this turn, whoever controlled it.
export default defineCard({
  name: "Gadrak, the Crown-Scourge",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}\n${TREASURE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-attack"],
      condition: { kind: "not", of: { kind: "controls", filter: { type: "artifact" }, atLeast: 4 } },
      text: ATTACK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Treasure Token",
        count: { turnHistory: "died", who: "each-player", filter: { token: false } },
      },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
