import { defineCard } from "../define.js";

const SHRINK_TEXT = "{B}, Pay 2 life: Target creature gets -1/-1 until end of turn.";
const DRAW_TEXT = "Whenever you lose life, draw that many cards. (Damage causes loss of life.)";

// Paying life is losing it (the ruling), so its own ability draws two — after
// the activation is finished, before it resolves.
export default defineCard({
  name: "Vilis, Broker of Blood",
  manaCost: "{5}{B}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 8,
  toughness: 8,
  keywords: ["flying"],
  text: `Flying\n${SHRINK_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 2 },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: SHRINK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "loses-life", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: { triggerValue: true } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
