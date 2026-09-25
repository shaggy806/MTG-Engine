import { defineCard } from "../define.js";

export default defineCard({
  name: "Towashi Songshaper",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 2,
  text: "Whenever another artifact you control enters, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another artifact you control enters, this creature gets +1/+0 until end of turn.",
    },
  ],
});
