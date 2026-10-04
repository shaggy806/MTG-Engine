import { defineCard } from "../define.js";

// EDHREC rank 3444.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2023-09-01] If this becomes a creature but you haven't controlled it continuously since your
//     most recent turn began, you won't be able to activate its mana ability or attack with it
//     that turn.
//   [2023-09-01] If this becomes a creature because of an effect other than its own ability, its
//     last ability will still trigger whenever it attacks.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Whatever you do, don't eat the delicious cards.
//   [2024-11-08] Some spells and abilities that create Food tokens may require targets. If each
//     target chosen is an illegal target as that spell or ability tries to resolve, it won't
//     resolve. You won't create any Food tokens.

const ANIMATE_TEXT =
  "{2}{B}{G}: This land becomes a 4/4 black and green Horror creature until end of turn. It's still a land.";
const ATTACK_TEXT =
  "Whenever this land attacks, create a Food token and exile up to one target card from a graveyard.";

export default defineCard({
  name: "Restless Cottage",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {B} or {G}.\n${ANIMATE_TEXT}\n${ATTACK_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
    },
    {
      cost: { mana: "{2}{B}{G}", tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 4,
        toughness: 4,
        addTypes: ["creature"],
        addSubtypes: ["Horror"],
        setColors: ["B", "G"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
  triggered: [
    {
      // Printed on the land, so it triggers however it became a creature (the ruling).
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Food Token", count: 1 },
          { kind: "exile", target: 0 },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
