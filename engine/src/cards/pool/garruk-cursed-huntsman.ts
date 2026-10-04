import { defineCard } from "../define.js";

// EDHREC rank 3797.
// Makes "Wolf Token (Garruk, Cursed Huntsman)".
//
// Rulings:
//   [2019-10-04] If the target creature is an illegal target by the time Garruk's second ability
//     tries to resolve, the ability won't resolve. You won't draw a card. If the target is legal
//     but not destroyed (most likely because it has indestructible), you will still draw.
//   [2019-10-04] If lethal damage is dealt to one of Garruk's Wolf tokens at the same time that
//     Garruk's loyalty is brought to 0 or less, Garruk is put into your graveyard before the
//     Wolf's triggered ability can save him.

export default defineCard({
  name: "Garruk, Cursed Huntsman",
  manaCost: "{4}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Garruk"],
  loyalty: 5,
  text: "0: Create two 2/2 black and green Wolf creature tokens with \"When this token dies, put a loyalty counter on each Garruk you control.\"\n−3: Destroy target creature. Draw a card.\n−6: You get an emblem with \"Creatures you control get +3/+3 and have trample.\"",
  activated: [
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token (Garruk, Cursed Huntsman)", count: 2 },
      resolve: null,
      text: "0: Create two 2/2 black and green Wolf creature tokens with \"When this token dies, put a loyalty counter on each Garruk you control.\"",
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [{ kind: "destroy", target: 0 }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "−3: Destroy target creature. Draw a card.",
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: "Creatures you control get +3/+3 and have trample.",
        static: {
          affects: { scope: "creatures-you-control" },
          grantPt: [3, 3],
          grantKeywords: ["trample"],
          text: "Creatures you control get +3/+3 and have trample.",
        },
      },
      resolve: null,
      text: "−6: You get an emblem with \"Creatures you control get +3/+3 and have trample.\"",
    },
  ],
});
