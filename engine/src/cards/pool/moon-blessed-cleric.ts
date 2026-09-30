import { defineCard } from "../define.js";

const TEXT =
  "Divine Intervention — When this creature enters, you may search your library for an enchantment card, reveal it, then shuffle and put that card on top.";

export default defineCard({
  name: "Moon-Blessed Cleric",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Elf", "Cleric"],
  power: 3,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for an enchantment card?",
        effect: {
          kind: "search-library",
          filter: { type: "enchantment" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
