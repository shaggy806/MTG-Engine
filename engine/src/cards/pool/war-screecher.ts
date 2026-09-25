import { defineCard } from "../define.js";

export default defineCard({
  name: "War Screecher",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{5}{W}, {T}: Other creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{5}{W}", tap: true },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "{5}{W}, {T}: Other creatures you control get +1/+1 until end of turn.",
    },
  ],
});
