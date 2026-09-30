import { defineCard } from "../define.js";

const TEXT = "Whenever you cast a noncreature spell, create a 1/1 white Monk creature token with prowess.";

// The Monk arrives after the spell was cast, so that spell doesn't trigger
// its prowess (its ruling).
export default defineCard({
  name: "Monastery Mentor",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 2,
  text: `Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Prowess",
    },
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Monk Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
