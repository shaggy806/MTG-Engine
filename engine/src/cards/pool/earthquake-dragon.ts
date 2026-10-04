import { defineCard } from "../define.js";

// EDHREC rank 3402.
//
// Rulings:
//   [2022-06-10] Earthquake Dragon's last ability can be activated only if it is in your
//     graveyard.
//   [2022-06-10] The total cost to cast Earthquake Dragon is locked in before you pay that cost.
//     For example, if you control three Dragons, each with mana value 4, including one you can
//     sacrifice to add {C}, the total cost of Earthquake Dragon is {2}{G}. Then you can sacrifice
//     the Dragon as you activate mana abilities just before paying the cost.
//   [2022-06-10] If a permanent has {X} in its mana cost, X is 0 when calculating its mana value.
//   [2022-06-10] Once a player has announced that they are casting Earthquake Dragon, no player
//     may take actions to try and change the number of Dragons its controller controls before that
//     spell's cost is locked in.
//   [2022-06-10] If the total mana value of Dragons you control is 14 or greater, Earthquake
//     Dragon costs {G} to cast.

const REDUCTION_TEXT =
  "This spell costs {X} less to cast, where X is the total mana value of Dragons you control.";
const RETURN_TEXT = "{2}{G}, Sacrifice a land: Return this card from your graveyard to your hand.";

// Metalwork Colossus's shape: a summed-mana-value reduction (generic only,
// so {G} always remains), and an ability that works only from the graveyard.
export default defineCard({
  name: "Earthquake Dragon",
  manaCost: "{14}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Dragon"],
  power: 10,
  toughness: 10,
  keywords: ["flying", "trample"],
  text: `${REDUCTION_TEXT}\nFlying, trample\n${RETURN_TEXT}`,
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: {
      aggregate: "sum",
      of: "mana-value",
      filter: { subtype: "Dragon", controlledBy: "you" },
    },
  },
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false, sacrifice: { filter: { type: "land" } } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "return-to-hand", target: "source", from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
