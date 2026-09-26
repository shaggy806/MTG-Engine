import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, if you control an artifact, create a 1/1 colorless Thopter artifact creature token with flying.";
const DRAW_TEXT = "Whenever one or more artifact creatures you control deal combat damage to a player, draw a card.";

// The upkeep trigger is an intervening-if (rule 603.4). The draw is once per
// player per combat damage step — twice in a combat with first strike (the
// rulings).
export default defineCard({
  name: "Thopter Spy Network",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${UPKEEP_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { types: ["artifact", "creature"] },
        combat: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
