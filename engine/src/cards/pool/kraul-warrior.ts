import { defineCard } from "../define.js";

export default defineCard({
  name: "Kraul Warrior",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Warrior"],
  power: 2,
  toughness: 2,
  text: "{5}{G}: This creature gets +3/+3 until end of turn.",
  activated: [
    {
      cost: { mana: "{5}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{5}{G}: This creature gets +3/+3 until end of turn.",
    },
  ],
});
