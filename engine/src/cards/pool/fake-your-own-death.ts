import { defineCard } from "../define.js";

const RETURN_TEXT =
  "When this creature dies, return it to the battlefield tapped under its owner's control and you create a Treasure token.";

// "You" in the granted ability is whoever controlled the creature as it died.
export default defineCard({
  name: "Fake Your Own Death",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    `Until end of turn, target creature gets +2/+0 and gains "${RETURN_TEXT}" ` +
    '(It\'s an artifact with "{T}, Sacrifice this token: Add one mana of any color.")',
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "dies", who: "self" },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "put-onto-battlefield", target: "trigger-object", enterTapped: true },
              { kind: "create-token", token: "Treasure Token", count: 1 },
            ],
          },
          resolve: null,
          text: RETURN_TEXT,
        },
      },
    ],
  },
});
