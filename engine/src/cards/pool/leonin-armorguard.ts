import { defineCard } from "../define.js";

export default defineCard({
  name: "Leonin Armorguard",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 3,
  toughness: 3,
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
