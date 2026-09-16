import { defineCard } from "../define.js";

export default defineCard({
  name: "Steel-Plume Marshal",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Steel-Plume Marshal attacks, other attacking creatures you control " +
    "with flying get +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        // "**Other** attacking creatures" — the Marshal is itself an
        // attacking flier, so without `exceptSource` it would pump itself.
        kind: "modify-pt-all",
        filter: {
          type: "creature",
          controlledBy: "you",
          keyword: "flying",
          attacking: true,
        },
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text:
        "Whenever Steel-Plume Marshal attacks, other attacking creatures you control " +
        "with flying get +2/+2 until end of turn.",
    },
  ],
});
