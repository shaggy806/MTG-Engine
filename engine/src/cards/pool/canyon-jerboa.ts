import { defineCard } from "../define.js";

export default defineCard({
  name: "Canyon Jerboa",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Mouse"],
  power: 1,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, creatures you control get +1/+1 until end of turn.",
    },
  ],
});
