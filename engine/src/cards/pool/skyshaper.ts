import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyshaper",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "Sacrifice this artifact: Creatures you control gain flying until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "flying",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice this artifact: Creatures you control gain flying until end of turn.",
    },
  ],
});
