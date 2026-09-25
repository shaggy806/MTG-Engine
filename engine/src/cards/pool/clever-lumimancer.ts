import { defineCard } from "../define.js";

export default defineCard({
  name: "Clever Lumimancer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 1,
  text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, this creature gets +2/+2 until end of turn.",
    },
  ],
});
