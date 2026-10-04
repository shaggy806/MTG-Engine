import { defineCard } from "../define.js";

// EDHREC rank 6146.
//
// Rulings:
//   [2024-04-12] A card, spell, or permanent is an outlaw if it has the Assassin, Mercenary,
//     Pirate, Rogue, or Warlock creature type. It doesn't matter if it has more than one of those
//     creature types; as long as it has at least one, it's an outlaw.
//   [2024-04-12] Double Down's ability and the copy it creates will resolve before the spell that
//     caused it to trigger. They resolve even if that spell is countered.
//   [2024-04-12] As a copy of a permanent spell resolves, it's put onto the battlefield as a token
//     rather than putting a copy of the spell onto the battlefield.
//   [2024-04-12] Double Down's ability doesn't trigger if an outlaw permanent is put onto the
//     battlefield without being cast.
//   [2024-04-12] The token that a resolving copy of a permanent spell becomes isn't "created."

const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];
const COPY_TEXT = "Whenever you cast an outlaw spell, copy that spell.";

export default defineCard({
  name: "Double Down",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you cast an outlaw spell, copy that spell. (Assassins, Mercenaries, Pirates, Rogues, and Warlocks are outlaws. Copies of permanent spells become tokens.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtypes: OUTLAWS } },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
