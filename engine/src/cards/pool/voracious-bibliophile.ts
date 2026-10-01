import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever you cast a spell with one or more targets, draw that many cards.";

// "That many" is how many targets the spell has; an Aura spell targets what
// it will enchant (the ruling).
export default defineCard({
  name: "Voracious Bibliophile",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", withTargets: true },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
