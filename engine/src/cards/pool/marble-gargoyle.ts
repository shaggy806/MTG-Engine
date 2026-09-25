import { defineCard } from "../define.js";

export default defineCard({
  name: "Marble Gargoyle",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Gargoyle"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{W}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{W}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
