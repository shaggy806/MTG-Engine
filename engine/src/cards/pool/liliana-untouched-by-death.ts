import { defineCard } from "../define.js";

// Grave Danger.
//
// - The −2's X is the Zombies you control as it resolves, fixed from then
//   on (its ruling, rule 608.2h).
// - The −3 lets you cast any Zombie spell from your graveyard this turn —
//   a creature or a kindred card with the type — including ones that reach
//   it later in the turn, each with its own costs and timing (its rulings):
//   a `player-effect` `castFromGraveyard`.
const PLUS =
  "+1: Mill three cards. If at least one Zombie card is milled this way, each opponent loses 2 life and you gain 2 life.";
const MINUS = "−2: Target creature gets -X/-X until end of turn, where X is the number of Zombies you control.";
const MINUS_THREE = "−3: You may cast Zombie spells from your graveyard this turn.";
const ZOMBIES = { countOf: { subtype: "Zombie", controlledBy: "you" } } as const;

export default defineCard({
  name: "Liliana, Untouched by Death",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Liliana"],
  loyalty: 4,
  text: `${PLUS}\n${MINUS}\n${MINUS_THREE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "milled", filter: { subtype: "Zombie" } },
            then: {
              kind: "sequence",
              effects: [
                { kind: "lose-life", amount: 2, who: "each-opponent" },
                { kind: "gain-life", amount: 2 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { product: [ZOMBIES, -1] },
        toughness: { product: [ZOMBIES, -1] },
        duration: "end-of-turn",
      },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "player-effect", duration: "end-of-turn", castFromGraveyard: { filter: { subtype: "Zombie" } } },
      resolve: null,
      text: MINUS_THREE,
    },
  ],
});
