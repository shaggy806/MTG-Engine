import { defineCard } from "../define.js";

// EDHREC rank 5261.
//
// Rulings:
//   [2020-06-23] If Sanctum of Calm Waters leaves the battlefield while its ability is on the
//     stack, you may control no Shrines as the ability resolves. If so, you may choose to draw
//     zero cards and discard one, or you may choose not to draw zero cards and not discard a card.
//   [2020-06-23] Each Shrine has an ability that counts the number of Shrines you control. These
//     abilities include the Shrine they're printed on.
//   [2020-06-23] Shrines count only enchantments with the subtype Shrine. Other cards with
//     “shrine” in their name (such as Jungle Shrine, Luxa River Shrine, and Nantuko Shrine) don't
//     count.
//   [2020-06-23] You draw X cards and discard a card all while the triggered ability is resolving.
//     Nothing can happen between the two, and no player may choose to take actions.

export default defineCard({
  name: "Sanctum of Calm Waters",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Shrine"],
  text: "At the beginning of your first main phase, you may draw X cards, where X is the number of Shrines you control. If you do, discard a card.",
  triggered: [
    {
      // X is read as it resolves: with no Shrines left, saying yes draws zero
      // and still discards (the ruling) — the discard rides on the "yes".
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw X cards (X = Shrines you control), then discard a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: { countOf: { type: "enchantment", subtype: "Shrine", controlledBy: "you" } } },
            { kind: "discard", target: "you", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: "At the beginning of your first main phase, you may draw X cards, where X is the number of Shrines you control. If you do, discard a card.",
    },
  ],
});
