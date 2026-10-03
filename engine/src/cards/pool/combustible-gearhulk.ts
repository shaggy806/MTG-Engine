import { defineCard } from "../define.js";

// The opponent's choice is between the two outcomes, made as the ability
// resolves (a `choices` question asked of the target player), and each is
// Gearhulk's controller's effect. They may choose the draw even with fewer
// than three cards left (the ruling). The damage is the milled cards' total
// mana value, {X} counting 0 (the ruling), each read where it went (rule
// 701.17c).
const TEXT =
  "When this creature enters, target opponent may have you draw three cards. If the player doesn't, you mill three cards, then this creature deals damage to that player equal to the total mana value of those cards.";

export default defineCard({
  name: "Combustible Gearhulk",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 6,
  toughness: 6,
  keywords: ["first-strike"],
  text: `First strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "each-player-may",
        who: { controllerOfTarget: 0 },
        choices: [
          { text: "Have them draw three cards.", effect: { kind: "draw", amount: 3 } },
          {
            text: "They mill three cards, then this deals damage to you equal to the total mana value of those cards.",
            effect: {
              kind: "sequence",
              effects: [
                { kind: "mill", target: "you", amount: 3 },
                { kind: "damage", target: 0, amount: { thisWay: "milled", sumOf: "mana-value" } },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
