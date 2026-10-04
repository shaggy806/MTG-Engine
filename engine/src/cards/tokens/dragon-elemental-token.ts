import { defineCard } from "../define.js";

// Elemental Eruption's Dragon Elemental token: 4/4 red, flying and prowess.

export default defineCard({
  name: "Dragon Elemental Token",
  art: "a59cf525-c9b6-4dc1-9f98-199436fb90f4",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon", "Elemental"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nProwess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
    },
  ],
});
