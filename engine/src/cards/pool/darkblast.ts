import { defineCard } from "../define.js";

// EDHREC rank 10077. Dredge is `CardDefinition.dredge` (Life from the Loam's).
export default defineCard({
  name: "Darkblast",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  dredge: 3,
  text:
    "Target creature gets -1/-1 until end of turn.\n" +
    "Dredge 3 (If you would draw a card, you may mill three cards instead. If you do, return this card from your graveyard to your hand.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
});
