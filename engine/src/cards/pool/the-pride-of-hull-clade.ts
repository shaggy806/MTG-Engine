import { defineCard } from "../define.js";

// EDHREC rank 5319.
//
// Rulings:
//   [2024-02-02] The Pride of Hull Clade's mana value doesn't change no matter what the total
//     toughness of creatures you control is.
//   [2024-02-02] Once you determine the cost to cast The Pride of Hull Clade, you may activate
//     mana abilities to pay that cost. If the total toughness of creatures you control changes
//     while activating mana abilities, the cost to cast The Pride of Hull Clade remains what you
//     previously determined.
//   [2024-02-02] If the target of The Pride of Hull Clade's last ability deals combat damage to a
//     player but leaves the battlefield before the granted triggered ability resolves, use its
//     toughness as it last existed on the battlefield to determine how many cards to draw.
//   [2024-02-02] The Pride of Hull Clade's cost reduction ability can't reduce the total cost to
//     cast the spell below {G}.
//   [2024-02-02] The first step of casting a spell is to move it to the stack. If this causes the
//     total toughness of creatures you control to change (perhaps because you control a creature
//     whose toughness is determined by the number of cards in your hand), that new toughness will
//     be used to determine the cost reduction.
//   [2024-02-02] Once you announce you're casting a spell, no player may take actions until the
//     spell has been paid for. Notably, opponents can't try to reduce the total toughness of
//     creatures you control.

const ACTIVATED_TEXT =
  "{2}{U}{U}: Until end of turn, target creature you control gets +1/+0, gains \"Whenever this creature deals combat damage to a player, draw cards equal to its toughness,\" and can attack as though it didn't have defender.";

export default defineCard({
  name: "The Pride of Hull Clade",
  manaCost: "{10}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Crocodile", "Elk", "Turtle"],
  power: 2,
  toughness: 15,
  keywords: ["defender"],
  text: `This spell costs {X} less to cast, where X is the total toughness of creatures you control.\nDefender\n${ACTIVATED_TEXT}`,
  selfCostReduction: {
    // Unconditional: the same always-true gate Ghalta, Primal Hunger uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    // Only the generic part comes off: {G} is always paid (the ruling).
    reduceGeneric: { aggregate: "sum", of: "toughness", filter: { type: "creature", controlledBy: "you" } },
  },
  activated: [
    {
      cost: { mana: "{2}{U}{U}", tap: false },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
          {
            kind: "grant-triggered",
            target: 0,
            duration: "end-of-turn",
            ability: {
              trigger: { on: "deals-combat-damage-to-player", who: "self" },
              targets: [],
              // Its toughness as it last existed if it has left (the ruling).
              effect: { kind: "draw", amount: { toughnessOf: "trigger-object" } },
              resolve: null,
              text: "Whenever this creature deals combat damage to a player, draw cards equal to its toughness.",
            },
          },
          { kind: "attack-despite-defender", target: 0 },
        ],
      },
      resolve: null,
      text: ACTIVATED_TEXT,
    },
  ],
});
