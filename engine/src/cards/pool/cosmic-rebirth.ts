import { defineCard } from "../define.js";

// Rulings:
//   [2023-05-12] You put the card into your hand if you didn't put it onto the battlefield
//     because you chose not to or because its mana value was 4 or greater.

const TEXT =
  "Choose target permanent card in your graveyard. If it has mana value 3 or less, you may put it onto the battlefield. If you don't put it onto the battlefield, put it into your hand.\nYou gain 3 life.";

// "If you don't put it onto the battlefield" covers declining, a mana value
// of 4 or more, and a card that couldn't enter (an Aura with nothing to
// enchant stays put, rule 303.4g): the hand step moves the card only if it's
// still in the graveyard.
export default defineCard({
  name: "Cosmic Rebirth",
  manaCost: "{1}{G}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text: TEXT,
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { manaValue: { op: "lte", n: 3 } } },
        then: {
          kind: "may",
          prompt: "Put it onto the battlefield? (Otherwise it goes to your hand.)",
          effect: { kind: "put-onto-battlefield", target: 0 },
        },
      },
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
