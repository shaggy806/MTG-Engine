import { defineCard } from "../define.js";

// Stormchaser's Talent's Otter token.

export default defineCard({
  name: "Otter Token",
  art: "e6b2c465-c446-4dee-9101-763105dcf813",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Otter"],
  power: 1,
  toughness: 1,
  text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
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
