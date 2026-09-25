import { defineCard } from "../define.js";

export default defineCard({
  name: "Earth-Origin Yak",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Ox"],
  power: 2,
  toughness: 4,
  text: "When this creature enters, creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When this creature enters, creatures you control get +1/+1 until end of turn.",
    },
  ],
});
