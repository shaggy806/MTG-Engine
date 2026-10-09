import { defineCard } from "../define.js";

// EDHREC rank 14463. Dredge is `CardDefinition.dredge` (Life from the
// Loam's): sacrificed, it's back in hand at the next draw.
const SAC_TEXT = "Sacrifice this creature: Put a +1/+1 counter on target creature.";

export default defineCard({
  name: "Shambling Shell",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Plant", "Zombie"],
  power: 3,
  toughness: 1,
  dredge: 3,
  text:
    `${SAC_TEXT}\n` +
    "Dredge 3 (If you would draw a card, you may mill three cards instead. If you do, return this card from your graveyard to your hand.)",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
