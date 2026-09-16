import { defineCard } from "../define.js";

export default defineCard({
  name: "Valor in Akros",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Whenever a creature you control enters, creatures you control get +1/+1 " +
    "until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "creature", controlledBy: "you" },
      },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "Whenever a creature you control enters, creatures you control get +1/+1 " +
        "until end of turn.",
    },
  ],
});
