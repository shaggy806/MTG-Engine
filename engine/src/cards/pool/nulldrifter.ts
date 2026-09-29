import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

export default defineCard({
  name: "Nulldrifter",
  manaCost: "{7}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Elemental"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  evoke: { cost: "{2}{U}" },
  text:
    "When you cast this spell, draw two cards.\nFlying\n" +
    "Annihilator 1 (Whenever this creature attacks, defending player sacrifices a permanent of their choice.)\n" +
    "Evoke {2}{U} (You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When you cast this spell, draw two cards.",
    },
    annihilator(1),
  ],
});
