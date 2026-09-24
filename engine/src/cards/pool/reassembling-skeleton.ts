import { defineCard } from "../define.js";

// "{1}{B}: Return this card from your graveyard to the battlefield tapped." —
// a graveyard ability whose cost *doesn't* exile the card (`staysInZone`):
// it can be activated again while the first activation is on the stack, and
// the second to resolve finds the card already gone and does nothing.
const TEXT = "{1}{B}: Return this card from your graveyard to the battlefield tapped.";

export default defineCard({
  name: "Reassembling Skeleton",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Skeleton", "Warrior"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
