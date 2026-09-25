import { defineCard } from "../define.js";

export default defineCard({
  name: "Glaze Fiend",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Illusion"],
  power: 0,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever another artifact you control enters, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another artifact you control enters, this creature gets +2/+2 until end of turn.",
    },
  ],
});
