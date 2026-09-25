import { defineCard } from "../define.js";

export default defineCard({
  name: "Quandrix Pledgemage",
  manaCost: "{1}{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Druid"],
  power: 2,
  toughness: 2,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, put a +1/+1 counter on this creature.",
    },
  ],
});
