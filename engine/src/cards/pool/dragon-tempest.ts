import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Tempest",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text:
    "Whenever a creature you control with flying enters, it gains haste until end of turn.\n" +
    "Whenever a Dragon you control enters, it deals X damage to any target, where X is the number of Dragons you control.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { keyword: "flying" },
      },
      targets: [],
      effect: { kind: "grant-keyword", target: "trigger-object", keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a creature you control with flying enters, it gains haste until end of turn.",
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dragon" },
      },
      targets: ["any-target"],
      effect: {
        kind: "damage",
        amount: { countOf: { subtype: "Dragon", controlledBy: "you" } },
        target: 0,
      },
      resolve: null,
      text: "Whenever a Dragon you control enters, it deals X damage to any target, where X is the number of Dragons you control.",
    },
  ],
});
