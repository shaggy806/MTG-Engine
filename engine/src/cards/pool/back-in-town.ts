import { defineCard } from "../define.js";

// EDHREC rank 4691.
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

// "X target …" is an `any-number` group fixed at X (Curse of the Swine's
// `min`/`max: "x"`); they return together, Reunion of the House's shape.
// An outlaw card is one with any of the five creature types (the rulings).
const OUTLAWS = ["Assassin", "Mercenary", "Pirate", "Rogue", "Warlock"];

export default defineCard({
  name: "Back in Town",
  manaCost: "{X}{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return X target outlaw creature cards from your graveyard to the battlefield. (Assassins, Mercenaries, Pirates, Rogues, and Warlocks are outlaws.)",
  targets: [
    {
      kind: "any-number",
      of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", subtypes: OUTLAWS } },
      min: "x",
      max: "x",
    },
  ],
  effect: {
    kind: "for-each-target",
    from: 0,
    simultaneous: true,
    effect: { kind: "put-onto-battlefield", target: 0 },
  },
});
