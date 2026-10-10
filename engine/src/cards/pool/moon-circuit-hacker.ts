import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 3614. "Unless this creature entered this turn" is read as the trigger resolves.
const HIT =
  "Whenever this creature deals combat damage to a player, you may draw a card. If you do, discard a card unless this creature entered this turn.";

export default defineCard({
  name: "Moon-Circuit Hacker",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Human", "Ninja"],
  power: 2,
  toughness: 1,
  text: `${ninjutsuText("{U}")}\n${HIT}`,
  activated: [ninjutsu("{U}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "not", of: { kind: "source", filter: { enteredThisTurn: true } } },
              then: { kind: "discard", target: "you", amount: 1 },
            },
          ],
        },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
