import { defineCard } from "../define.js";

// EDHREC rank 5278.
//
// Rulings:
//   [2023-02-04] A player with ten or more poison counters loses the game. This is a state-based
//     action and doesn't use the stack. In other words, it happens immediately and players can't
//     respond to it, just like a player losing the game due to having 0 or less life.
//   [2023-02-04] Multiple instances of toxic are cumulative. For example, if a creature has toxic
//     2 and gains toxic 1 due to another effect, combat damage that creature deals to a player
//     will cause that player to get 3 poison counters.
//   [2023-02-04] Toxic doesn't change the amount of combat damage a creature deals. For example,
//     if a 2/2 creature with toxic 1 deals combat damage to a player, that creature will deal 2
//     damage. The results of that damage are the player loses 2 life and gets a poison counter.
//   [2023-02-04] Damage dealt by a creature with toxic grants the same number of counters
//     regardless of how much damage is dealt. Notably, if a replacement effect modifies the damage
//     in some way (such as that of Gratuitous Violence), the number of counters given remains
//     unchanged.
//   [2023-02-04] Conversely, replacement effects that apply to the number of counters put on a
//     player can modify the counters placed this way. For example, Vorinclex, Monstrous Raider's
//     last two abilities can apply to counters placed this way.
//   [2023-02-04] If a creature with toxic deals combat damage to a creature or planeswalker, or if
//     it deals noncombat damage, toxic has no effect and no player gets poison counters.
//   [2023-02-04] Any other effects of that damage, such as life gain from lifelink, still apply.

export default defineCard({
  name: "Necrogen Communion",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature you control\nEnchanted creature has toxic 2. (Players dealt combat damage by it also get two poison counters.)\nWhen enchanted creature dies, return that card to the battlefield under your control.",
  targets: ["creature-you-control"],
  static: [{ affects: { scope: "attached" }, grantToxic: 2, text: "Enchanted creature has toxic 2." }],
  triggered: [
    {
      // "That card": the creature card in the graveyard it went to, only while
      // it's still there (rule 400.7); "your" is the Aura's controller.
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      resolve: null,
      text: "When enchanted creature dies, return that card to the battlefield under your control.",
    },
  ],
});
