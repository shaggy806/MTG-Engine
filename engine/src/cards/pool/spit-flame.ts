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
      // It returns its own card from the graveyard, so it works only there
      // (rule 113.6k), and returns that card — not another Spit Flame, and
      // nothing if this one has left the graveyard since.
      fromGraveyard: true,
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
        effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      },
      resolve: null,
      text: "Whenever a Dragon you control enters, you may pay {R}. If you do, return this card from your graveyard to your hand.",
    },
  ],
});
