import { defineCard } from "../define.js";

export default defineCard({
  name: "Eureka Moment",
  manaCost: "{2}{G}{U}",
  colors: ["G", "U"],
  types: ["instant"],
  text: "Draw two cards. You may put a land card from your hand onto the battlefield.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
    ],
  },
});
