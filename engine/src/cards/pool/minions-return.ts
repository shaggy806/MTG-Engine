import { defineCard } from "../define.js";

// EDHREC rank 5614.
//
// Kaya's Ghostform's shape: the trigger is the Aura's, reading its host as it
// last existed (rule 603.10a), and "that card" comes back only if it's still
// the card that died — a token never does (rule 400.7, the ruling).
//
// Rulings:
//   [2020-01-24] In a multiplayer game, if a player leaves the game, all cards that player owns
//     leave as well. If you leave the game, the creature you control from Minion's Return is
//     exiled if you don't own it.
//   [2020-01-24] If Minion's Return enchants a token creature, that creature won't return to the
//     battlefield when it dies. Choose your minions wisely.

const TEXT = "When enchanted creature dies, return that card to the battlefield under your control.";

export default defineCard({
  name: "Minion's Return",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: `Flash\nEnchant creature\n${TEXT}`,
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
