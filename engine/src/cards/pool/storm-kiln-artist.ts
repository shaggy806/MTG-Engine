import { defineCard } from "../define.js";

// Magecraft: a cast trigger that also fires on a copy (`orCopy`).
export default defineCard({
  name: "Storm-Kiln Artist",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf", "Shaman"],
  power: 2,
  toughness: 2,
  text:
    "This creature gets +1/+0 for each artifact you control.\n" +
    'Magecraft — Whenever you cast or copy an instant or sorcery spell, create a Treasure token. (It\'s an artifact with "{T}, Sacrifice this token: Add one mana of any color.")',
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [1, 0] },
      text: "This creature gets +1/+0 for each artifact you control.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Magecraft — Whenever you cast or copy an instant or sorcery spell, create a Treasure token.",
    },
  ],
});
