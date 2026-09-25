import { defineCard } from "../define.js";

export default defineCard({
  name: "Syr Alin, the Lion's Claw",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)\nWhenever Syr Alin attacks, other creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
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
      text: "Whenever Syr Alin attacks, other creatures you control get +1/+1 until end of turn.",
    },
  ],
});
