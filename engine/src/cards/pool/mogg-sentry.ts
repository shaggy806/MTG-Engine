import { defineCard } from "../define.js";

export default defineCard({
  name: "Mogg Sentry",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever an opponent casts a spell, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever an opponent casts a spell, this creature gets +2/+2 until end of turn.",
    },
  ],
});
