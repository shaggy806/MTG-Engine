import { defineCard } from "../define.js";

export default defineCard({
  name: "Spit Flame",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Spit Flame deals 4 damage to target creature.\n" +
    "Whenever a Dragon you control enters, you may pay {R}. If you do, return this card from your graveyard to your hand.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dragon" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {R} to return Spit Flame to your hand?",
        cost: "{R}",
        // "this card from your graveyard" — a name-filtered recursion of
        // itself, which is the only card the filter can ever match.
        effect: {
          kind: "return-from-graveyard",
          filter: { name: "Spit Flame" },
          destination: "hand",
          count: 1,
        },
      },
      resolve: null,
      text: "Whenever a Dragon you control enters, you may pay {R}. If you do, return this card from your graveyard to your hand.",
    },
  ],
});
