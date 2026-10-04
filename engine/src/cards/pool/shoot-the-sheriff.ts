import { defineCard } from "../define.js";

// EDHREC rank 4174.
//
// Rulings:
//   [2024-04-12] The only deputy in the Outlaws of Thunder Junction release is a Mercenary, so no,
//     you cannot shoot the deputy.
//   [2024-04-12] A card, spell, or permanent is an outlaw if it has the Assassin, Mercenary,
//     Pirate, Rogue, or Warlock creature type. It doesn’t matter if it has more than one of those
//     creature types; as long as it has at least one, it’s an outlaw.
//   [2024-04-12] Outlaw is not a creature type. If an effect asks you to choose a creature type,
//     you can’t choose outlaw.
//   [2024-04-12] If an ability refers to an outlaw or whether a player controls an outlaw, it’s
//     referring only to permanents with one or more of the creature types specified above.
//     Notably, it’s not referring to any spell or card not on the battlefield. However, other
//     abilities may refer to an “outlaw spell” or “outlaw card” in a zone other than the
//     battlefield. Those abilities refer to spells and cards with one or more of the specified
//     creature types.

// Outlaws are the five creature types the reminder text lists (Vihaan,
// Goldwaker's list); `notSubtypes` reads them through `hasSubtype`, so a
// changeling is an outlaw and can't be shot.
const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];

export default defineCard({
  name: "Shoot the Sheriff",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target non-outlaw creature. (Assassins, Mercenaries, Pirates, Rogues, and Warlocks are outlaws. Everyone else is fair game.)",
  targets: [{ kind: "permanent", filter: { type: "creature", notSubtypes: OUTLAWS } }],
  effect: { kind: "destroy", target: 0 },
});
