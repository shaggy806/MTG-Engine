import { defineCard } from "../define.js";

// EDHREC rank 5051.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2024-04-12] Outlaw is not a creature type. If an effect asks you to choose a creature type,
//     you can’t choose outlaw.
//   [2024-04-12] A card, spell, or permanent is an outlaw if it has the Assassin, Mercenary,
//     Pirate, Rogue, or Warlock creature type. It doesn’t matter if it has more than one of those
//     creature types; as long as it has at least one, it’s an outlaw.
//   [2024-04-12] If an ability refers to an outlaw or whether a player controls an outlaw, it’s
//     referring only to permanents with one or more of the creature types specified above.
//     Notably, it’s not referring to any spell or card not on the battlefield. However, other
//     abilities may refer to an “outlaw spell” or “outlaw card” in a zone other than the
//     battlefield. Those abilities refer to spells and cards with one or more of the specified
//     creature types.

// Outlaws are the five creature types the reminder text names (Vihaan,
// Goldwaker's list). The batched damage trigger fires once for each player
// those outlaws dealt combat damage to (Frostcliff Siege's shape).
const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];
const TREASURE_TEXT =
  "Whenever one or more outlaws you control deal combat damage to a player, create a Treasure token. (Assassins, Mercenaries, Pirates, Rogues, and Warlocks are outlaws.)";
const COUNTERS_TEXT =
  "{3}, Sacrifice two Treasures: Put two +1/+1 counters on each creature you control. Activate only as a sorcery.";

export default defineCard({
  name: "Olivia, Opulent Outlaw",
  manaCost: "{1}{R}{W}{B}",
  colors: ["W", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Assassin"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${TREASURE_TEXT}\n${COUNTERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtypes: OUTLAWS }, combat: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}", tap: false, sacrifice: { filter: { subtype: "Treasure" }, count: 2 } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 2,
      },
      resolve: null,
      text: COUNTERS_TEXT,
      sorcerySpeed: true,
    },
  ],
});
