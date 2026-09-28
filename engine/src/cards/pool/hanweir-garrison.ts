import { defineCard } from "../define.js";

// The front half of a meld pair. Melding is Hanweir Battlements' ability, not
// this card's, and the Battlements isn't in the pool, so nothing on this card
// is left out: its line about melding is reminder text.
const ATTACK_TEXT =
  "Whenever this creature attacks, create two 1/1 red Human creature tokens that are tapped and attacking.";

export default defineCard({
  name: "Hanweir Garrison",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: `${ATTACK_TEXT}\n(Melds with Hanweir Battlements.)`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Red Human Token", count: 2, tapped: true, attacking: "choose" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
