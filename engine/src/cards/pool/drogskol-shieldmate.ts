import { defineCard } from "../define.js";

export default defineCard({
  name: "Drogskol Shieldmate",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Soldier"],
  power: 2,
  toughness: 3,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, other creatures you control get +0/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 0,
        toughness: 1,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "When this creature enters, other creatures you control get +0/+1 until end of turn.",
    },
  ],
});
