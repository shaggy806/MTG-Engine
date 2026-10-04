import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// EDHREC rank 3760.
//
// The front half of a meld pair, as Hanweir Garrison is: melding is Titania,
// Voice of Gaea's ability, not this card's, and Titania isn't in the pool, so
// nothing on this card is left out — its line about melding is reminder text.
// The legendary green creature has to be there already as Argoth enters
// (Rivendell's shape — rule 614.12).
const BEAR_TEXT =
  "{2}{G}{G}, {T}: Create a 2/2 green Bear creature token, then mill three cards. Activate only as a sorcery.";
const LEGENDARY_GREEN = {
  kind: "controls",
  filter: { type: "creature", supertype: "legendary", colors: ["G"] },
  atLeast: 1,
} as const;

export default defineCard({
  name: "Argoth, Sanctum of Nature",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control a legendary green creature.\n{T}: Add {G}.\n${BEAR_TEXT}\n(Melds with Titania, Voice of Gaea.)`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tappedUnless: LEGENDARY_GREEN },
      text: "This land enters tapped unless you control a legendary green creature.",
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{2}{G}{G}", tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Bear Token", count: 1 },
          { kind: "mill", target: "you", amount: 3 },
        ],
      },
      resolve: null,
      text: BEAR_TEXT,
    },
  ],
});
