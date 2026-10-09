import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

// EDHREC rank 1206. A cast trigger: it resolves before the spell, and still
// does if the spell is countered.
const CAST = "When you cast this spell, you may return target creature card from your graveyard to the battlefield.";

export default defineCard({
  name: "Artisan of Kozilek",
  manaCost: "{9}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 9,
  text: `${CAST}\nAnnihilator 2 (Whenever this creature attacks, defending player sacrifices two permanents of their choice.)`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Return the target creature card to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: CAST,
    },
    annihilator(2),
  ],
});
