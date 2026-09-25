import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghosts of the Damned",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 0,
  toughness: 2,
  text: "{T}: Target creature gets -1/-0 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets -1/-0 until end of turn.",
    },
  ],
});
