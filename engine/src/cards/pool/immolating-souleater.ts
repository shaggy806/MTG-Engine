import { defineCard } from "../define.js";

export default defineCard({
  name: "Immolating Souleater",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Dog"],
  power: 1,
  toughness: 1,
  text: "{R/P}: This creature gets +1/+0 until end of turn. ({R/P} can be paid with either {R} or 2 life.)",
  activated: [
    {
      cost: { mana: "{R/P}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R/P}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
