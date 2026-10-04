import { defineCard } from "../define.js";

// EDHREC rank 4164.
//
// Rulings:
//   [2023-06-16] Typecycling is a form of cycling. Any ability that triggers on a card being
//     cycled also triggers on a card being typecycled. Any ability that stops a cycling ability
//     from being activated also stops a typecycling ability from being activated.
//   [2023-06-16] Unlike the normal cycling ability, typecycling doesn't allow you to draw a card.
//     Rather, it lets you search your library for a card with the type or types indicated by the
//     ability name. For example, a card with basic landcycling lets you search for a basic land
//     card, and a card with Wizardcycling lets you search for a Wizard card.

const ATTACK_TEXT =
  "Whenever this creature attacks, another target creature you control gets +2/+0 and gains trample until end of turn.";

export default defineCard({
  name: "Oliphaunt",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 6,
  toughness: 4,
  keywords: ["trample"],
  text: `Trample\n${ATTACK_TEXT}\nMountaincycling {1} ({1}, Discard this card: Search your library for a Mountain card, reveal it, put it into your hand, then shuffle.)`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  cycling: { cost: "{1}", search: { subtype: "Mountain" } },
});
