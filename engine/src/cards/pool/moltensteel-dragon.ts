import { defineCard } from "../define.js";

export default defineCard({
  name: "Moltensteel Dragon",
  manaCost: "{4}{R/P}{R/P}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "({R/P} can be paid with either {R} or 2 life.)\nFlying\n{R/P}: This creature gets +1/+0 until end of turn.",
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
