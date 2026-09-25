import { defineCard } from "../define.js";

export default defineCard({
  name: "Eyeblight Assassin",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Assassin"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, target creature an opponent controls gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature an opponent controls gets -1/-1 until end of turn.",
    },
  ],
});
