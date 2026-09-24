import { defineCard } from "../define.js";

/**
 * Counters that survive a zone change (`countersPersistAcrossZones`): it
 * keeps them dying, being exiled, going to the command zone, and being cast
 * again from there; a bounce or a tuck strips them.
 */
export default defineCard({
  name: "Skullbriar, the Walking Grave",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Elemental"],
  power: 1,
  toughness: 1,
  keywords: ["haste"],
  text:
    "Haste\n" +
    "Whenever Skullbriar deals combat damage to a player, put a +1/+1 counter on it.\n" +
    "Counters remain on Skullbriar as it moves to any zone other than a player's hand or library.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever Skullbriar deals combat damage to a player, put a +1/+1 counter on it.",
    },
  ],
  countersPersistAcrossZones: true,
});
