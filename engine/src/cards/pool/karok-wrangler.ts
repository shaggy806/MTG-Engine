import { defineCard } from "../define.js";

export default defineCard({
  name: "Karok Wrangler",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 3,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, put a +1/+1 counter on target creature you control.",
    },
  ],
});
