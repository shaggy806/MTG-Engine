import { defineCard } from "../define.js";

export default defineCard({
  name: "Frontier Siege",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "As this enchantment enters, choose Khans or Dragons.\n" +
    "• Khans — At the beginning of each of your main phases, add {G}{G}.\n" +
    "• Dragons — Whenever a creature you control with flying enters, you may have it fight target creature you don't control.",
  chooseOnEnter: ["Khans", "Dragons"],
  triggered: [
    {
      // Each of your main phases — two triggers, one per main phase, both
      // gated on the mode named as this entered.
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Khans" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: "Khans — At the beginning of your precombat main phase, add {G}{G}.",
    },
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      condition: { kind: "chosen-on-enter", value: "Khans" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: "Khans — At the beginning of your postcombat main phase, add {G}{G}.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", keyword: "flying" },
      },
      condition: { kind: "chosen-on-enter", value: "Dragons" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "may",
        prompt: "Fight target creature?",
        // "It" is the creature that entered (the trigger object), fighting
        // the chosen target.
        effect: { kind: "fight", a: "trigger-object", b: 0 },
      },
      resolve: null,
      text: "Dragons — Whenever a creature you control with flying enters, you may have it fight target creature you don't control.",
    },
  ],
});
