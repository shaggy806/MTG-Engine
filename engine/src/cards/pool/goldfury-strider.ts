import { defineCard } from "../define.js";

export default defineCard({
  name: "Goldfury Strider",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample\nTap two untapped artifacts and/or creatures you control: Target creature gets +2/+0 until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 2,
          filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Tap two untapped artifacts and/or creatures you control: Target creature gets +2/+0 until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
