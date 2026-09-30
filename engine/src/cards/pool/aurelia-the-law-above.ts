import { defineCard } from "../define.js";

const THREE_TEXT = "Whenever a player attacks with three or more creatures, you draw a card.";
const FIVE_TEXT =
  "Whenever a player attacks with five or more creatures, Aurelia deals 3 damage to each of your opponents and you gain 3 life.";

// Any player's attack, yours included; five attackers fire both.
export default defineCard({
  name: "Aurelia, the Law Above",
  manaCost: "{3}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance", "haste"],
  text: `Flying, vigilance, haste\n${THREE_TEXT}\n${FIVE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "any", atLeast: 3 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: THREE_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "any", atLeast: 5 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 3, who: "each-opponent" },
          { kind: "gain-life", amount: 3 },
        ],
      },
      resolve: null,
      text: FIVE_TEXT,
    },
  ],
});
