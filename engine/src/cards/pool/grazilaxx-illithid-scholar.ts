import { defineCard } from "../define.js";

const BLOCKED_TEXT = "Whenever a creature you control becomes blocked, you may return it to its owner's hand.";
const DAMAGE_TEXT = "Whenever one or more creatures you control deal combat damage to a player, draw a card.";

export default defineCard({
  name: "Grazilaxx, Illithid Scholar",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 3,
  toughness: 2,
  text: `${BLOCKED_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Return that creature to its owner's hand?",
        effect: { kind: "return-to-hand", target: "trigger-object" },
      },
      resolve: null,
      text: BLOCKED_TEXT,
    },
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
