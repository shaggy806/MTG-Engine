import { defineCard } from "../define.js";

export default defineCard({
  name: "Rune-Cervin Rider",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elf", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{G/W}{G/W}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{G/W}{G/W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G/W}{G/W}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
