import { defineCard } from "../define.js";
import { commanderNinjutsu, commanderNinjutsuText } from "../helpers.js";

// EDHREC rank 2496 (top-500 commander). Commander ninjutsu (rule 702.49d)
// works from the hand or the command zone, and isn't a cast: no commander
// tax. The revealed card goes to the hand whatever it is; its mana value is
// read there (Dark Confidant's shape), 0 for a land.
const HIT =
  "Whenever a Ninja you control deals combat damage to a player, reveal the top card of your library and put that card into your hand. Each opponent loses life equal to that card's mana value.";

export default defineCard({
  name: "Yuriko, the Tiger's Shadow",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 1,
  toughness: 3,
  text: `${commanderNinjutsuText("{U}{B}")}\n${HIT}`,
  activated: [...commanderNinjutsu("{U}{B}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtype: "Ninja" } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "stay",
        reveal: true,
        then: { kind: "lose-life", who: "each-opponent", amount: { manaValueOf: 0 } },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
