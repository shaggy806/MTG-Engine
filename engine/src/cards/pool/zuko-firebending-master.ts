import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// EDHREC rank 5170.
//
// Rulings:
//   [2025-10-02] "Firebending N" is a keyword that represents the ability "Whenever this creature
//     attacks, add N {R}. Until end of combat, you don't lose this mana as steps end."
//   [2025-10-02] Firebending abilities aren't mana abilities. They use the stack and can be
//     responded to.
//   [2025-10-02] All experience counters are identical, no matter how you got them. For example,
//     the firebending ability will count experience counters that you got from the last ability,
//     from another ability, from another copy of Zuko, Firebending Master, and so on.
//   [2025-10-02] Mana from firebending abilities isn't lost until you leave combat and go to your
//     second main phase. It can be used at any time during combat, even after combat damage has
//     been dealt.
//   [2025-10-02] Any other mana you add during combat will still be lost as normal when moving
//     between steps of combat.
//   [2025-10-02] The experience counter goes on you, the player, not on Zuko. You will keep that
//     counter even if Zuko, Firebending Master dies.
//   [2025-10-02] Multiple instances of firebending on the same creature trigger separately, each
//     granting you the appropriate amount of mana.

export default defineCard({
  name: "Zuko, Firebending Master",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Ally"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike\nFirebending X, where X is the number of experience counters you have. (Whenever this creature attacks, add X {R}. This mana lasts until end of combat.)\nWhenever you cast a spell during combat, you get an experience counter.",
  triggered: [
    // X is read as the ability resolves (it uses the stack — the rulings).
    firebending(
      { playerCounters: "experience" },
      "Firebending X, where X is the number of experience counters you have. (Whenever this creature attacks, add X {R}. This mana lasts until end of combat.)",
    ),
    {
      // "During combat" is part of the trigger condition (rule 603.1), not an
      // intervening if.
      trigger: { on: "cast-spell", who: "you" },
      whileCondition: { kind: "turn-structure", duringCombat: true },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: "Whenever you cast a spell during combat, you get an experience counter.",
    },
  ],
});
