import { defineCard } from "../define.js";

// EDHREC rank 4883.

const SAC_TEXT = "{2}{R}, {T}, Sacrifice this creature: It deals 6 damage to target creature with flying.";

// The sacrifice is Stadium Headliner's shape (the damage comes from the
// sacrificed creature's last-known information); the target is Clan
// Defiance's "creature with flying".
export default defineCard({
  name: "Sunset Strikemaster",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 3,
  toughness: 1,
  text: `{T}: Add {R}.\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{2}{R}", tap: true, sacrifice: "self" },
      targets: [{ kind: "permanent", filter: { type: "creature", keyword: "flying" } }],
      effect: { kind: "damage", target: 0, amount: 6 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
