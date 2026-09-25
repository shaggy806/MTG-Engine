import { defineCard } from "../define.js";

export default defineCard({
  name: "Eager First-Year",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, this creature gets +1/+0 until end of turn.",
    },
  ],
});
