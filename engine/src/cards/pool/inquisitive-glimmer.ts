import { defineCard } from "../define.js";

// EDHREC rank 2599. Herald of the Pantheon's reduction, and the same for a
// Room's unlock costs (`abilityCostModification.unlock`) — generic mana only.
const SPELLS = "Enchantment spells you cast cost {1} less to cast.";
const UNLOCKS = "Unlock costs you pay cost {1} less.";

export default defineCard({
  name: "Inquisitive Glimmer",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["enchantment", "creature"],
  subtypes: ["Fox", "Glimmer"],
  power: 2,
  toughness: 3,
  text: `${SPELLS}\n${UNLOCKS}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "enchantment" }, caster: "you", reduceGeneric: 1 },
      text: SPELLS,
    },
    {
      affects: { scope: "self" },
      abilityCostModification: { applies: {}, reduceGeneric: 1, unlock: true },
      text: UNLOCKS,
    },
  ],
});
