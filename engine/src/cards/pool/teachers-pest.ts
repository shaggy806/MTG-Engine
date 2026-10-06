import { defineCard } from "../define.js";

// "{B}{G}: Return this card from your graveyard to the battlefield tapped." —
// a graveyard ability whose cost doesn't exile the card (`staysInZone`), as
// Reassembling Skeleton.
const RETURN_TEXT = "{B}{G}: Return this card from your graveyard to the battlefield tapped.";

export default defineCard({
  name: "Teacher's Pest",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Skeleton", "Pest"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: `Menace (This creature can't be blocked except by two or more creatures.)\nWhenever this creature attacks, you gain 1 life.\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: "{B}{G}", tap: false },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, you gain 1 life.",
    },
  ],
});
