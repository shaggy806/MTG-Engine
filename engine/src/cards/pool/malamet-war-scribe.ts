import { defineCard } from "../define.js";

export default defineCard({
  name: "Malamet War Scribe",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 4,
  toughness: 3,
  text: "When this creature enters, creatures you control get +2/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 2,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When this creature enters, creatures you control get +2/+1 until end of turn.",
    },
  ],
});
