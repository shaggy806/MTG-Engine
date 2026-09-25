import { defineCard } from "../define.js";

export default defineCard({
  name: "Devkarin Dissident",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: "{4}{G}: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{G}: This creature gets +2/+2 until end of turn.",
    },
  ],
});
