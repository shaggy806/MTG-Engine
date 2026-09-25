import { defineCard } from "../define.js";

export default defineCard({
  name: "Lionheart Maverick",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 1,
  keywords: ["vigilance"],
  text: "Vigilance\n{4}{W}: This creature gets +1/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{W}: This creature gets +1/+2 until end of turn.",
    },
  ],
});
