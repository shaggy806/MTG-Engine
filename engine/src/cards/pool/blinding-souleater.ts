import { defineCard } from "../define.js";

export default defineCard({
  name: "Blinding Souleater",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Cleric"],
  power: 1,
  toughness: 3,
  text: "{W/P}, {T}: Tap target creature. ({W/P} can be paid with either {W} or 2 life.)",
  activated: [
    {
      cost: { mana: "{W/P}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{W/P}, {T}: Tap target creature.",
    },
  ],
});
