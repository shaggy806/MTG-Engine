import { defineCard } from "../define.js";

export default defineCard({
  name: "Cutthroat Centurion",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Warrior"],
  power: 2,
  toughness: 2,
  text: "Sacrifice another artifact or creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice another artifact or creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      otherOnly: true,
      oncePerTurn: true,
    },
  ],
});
