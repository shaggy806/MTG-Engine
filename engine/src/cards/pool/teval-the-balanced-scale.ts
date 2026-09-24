import { defineCard } from "../define.js";

// "Whenever one or more cards leave your graveyard" is batched: cards that
// leave at the same time trigger it once (the card's ruling) — a whole
// graveyard exiled, the cards a choice returns together — while separate
// moves are separate triggers, the two halves of an escape cast included
// (the card to the stack, then the cards exiled to pay for it). Casting or
// playing a card from the graveyard counts: it leaves the graveyard.
//
// "Then you may return a land card" is a choice made after the mill, among
// whatever lands the graveyard then holds (the three just milled included),
// and may take none.
export default defineCard({
  name: "Teval, the Balanced Scale",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Teval attacks, mill three cards. Then you may return a land card from your " +
    "graveyard to the battlefield tapped.\n" +
    "Whenever one or more cards leave your graveyard, create a 2/2 black Zombie Druid " +
    "creature token.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "look-and-choose",
            zone: "graveyard",
            min: 0,
            max: 1,
            destination: "battlefield",
            enterTapped: true,
            leftover: "stay",
            filter: { type: "land" },
          },
        ],
      },
      resolve: null,
      text:
        "Whenever Teval attacks, mill three cards. Then you may return a land card from your " +
        "graveyard to the battlefield tapped.",
    },
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Druid Token", count: 1 },
      resolve: null,
      text:
        "Whenever one or more cards leave your graveyard, create a 2/2 black Zombie Druid " +
        "creature token.",
    },
  ],
});
