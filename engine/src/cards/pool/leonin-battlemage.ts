import { defineCard } from "../define.js";

export default defineCard({
  name: "Leonin Battlemage",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Wizard"],
  power: 2,
  toughness: 3,
  text: "{T}: Target creature gets +1/+1 until end of turn.\nWhenever you cast a spell, you may untap this creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets +1/+1 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "may", prompt: "Untap ~?", effect: { kind: "untap", target: "source" } },
      resolve: null,
      text: "Whenever you cast a spell, you may untap this creature.",
    },
  ],
});
