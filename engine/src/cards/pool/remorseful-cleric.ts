import { defineCard } from "../define.js";

export default defineCard({
  name: "Remorseful Cleric",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Cleric"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nSacrifice Remorseful Cleric: Exile target player's graveyard.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: "Sacrifice Remorseful Cleric: Exile target player's graveyard.",
    },
  ],
});
