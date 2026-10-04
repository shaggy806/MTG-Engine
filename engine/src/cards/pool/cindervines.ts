import { defineCard } from "../define.js";

// EDHREC rank 6417.
//
// Rulings:
//   [2019-01-25] Cindervines can be the target of its own activated ability. The ability won't
//     resolve since it won't have a legal target, and no player will be dealt damage, but this
//     does allow you to sacrifice Cindervines without anything else to target if you want to.
//   [2019-01-25] If the target permanent is an illegal target by the time Cindervines's activated
//     ability tries to resolve, the ability doesn't resolve. No player is dealt damage. If the
//     target is legal but not destroyed (most likely because it has indestructible), its
//     controller is dealt damage.
//   [2019-01-25] Cindervines's triggered ability resolves before the spell that caused it to
//     trigger. It resolves even if that spell is countered.

const CAST_TEXT = "Whenever an opponent casts a noncreature spell, this enchantment deals 1 damage to that player.";
const SAC_TEXT =
  "{1}, Sacrifice this enchantment: Destroy target artifact or enchantment. This enchantment deals 2 damage to that permanent's controller.";

export default defineCard({
  name: "Cindervines",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  types: ["enchantment"],
  text: `${CAST_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      // Unlicensed Disintegration's shape: the controller is read as
      // last-known information, so an indestructible target's controller is
      // still dealt the damage, and an illegal target stops it all (rulings).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "damage", amount: 2, toControllerOfTarget: 0 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", noncreatureOnly: true },
      targets: [],
      // "That player" is the caster (Magebane Lizard's shape).
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
