import { defineCard } from "../define.js";

// EDHREC rank 3295.

const TEXT =
  "Whenever a nontoken artifact you control enters, create a colorless artifact token named Munitions with \"When this token leaves the battlefield, it deals 2 damage to any target.\"";

export default defineCard({
  name: "Weapons Manufacturing",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "artifact" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Munitions Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
