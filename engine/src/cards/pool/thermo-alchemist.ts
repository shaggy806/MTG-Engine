import { defineCard } from "../define.js";

export default defineCard({
  name: "Thermo-Alchemist",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text:
    "Defender\n" +
    "{T}: Thermo-Alchemist deals 1 damage to each opponent.\n" +
    "Whenever you cast an instant or sorcery spell, untap Thermo-Alchemist.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{T}: Thermo-Alchemist deals 1 damage to each opponent.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, untap Thermo-Alchemist.",
    },
  ],
});
