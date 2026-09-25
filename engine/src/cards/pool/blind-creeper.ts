import { defineCard } from "../define.js";

export default defineCard({
  name: "Blind Creeper",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Beast"],
  power: 3,
  toughness: 3,
  text: "Whenever a player casts a spell, this creature gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: -1,
        toughness: -1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever a player casts a spell, this creature gets -1/-1 until end of turn.",
    },
  ],
});
