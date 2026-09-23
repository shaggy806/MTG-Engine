import { defineCard } from "../define.js";

export default defineCard({
  name: "Vito, Thorn of the Dusk Rose",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 1,
  toughness: 3,
  text:
    "Whenever you gain life, target opponent loses that much life.\n" +
    "{3}{B}{B}: Creatures you control gain lifelink until end of turn.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: ["opponent"],
      effect: { kind: "lose-life", target: 0, amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever you gain life, target opponent loses that much life.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{B}{B}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "lifelink",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{3}{B}{B}: Creatures you control gain lifelink until end of turn.",
    },
  ],
});
