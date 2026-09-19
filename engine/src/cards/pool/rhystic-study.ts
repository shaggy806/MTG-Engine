import { defineCard } from "../define.js";

/**
 * A punisher clause: the *caster* decides whether to pay, not this card's
 * controller, which is what `unless` is for. `chooser: "trigger-controller"`
 * resolves through the trigger's object — a `cast-spell` trigger carries the
 * spell, whose controller is the player who cast it.
 *
 * Simplification: the printed "**you may** draw a card unless…" folds into the
 * `unless` itself, so an unpaid trigger always draws rather than offering its
 * controller a second, pointless decision.
 */
export default defineCard({
  name: "Rhystic Study",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "trigger-controller",
        options: [{ pay: "{1}", text: "Pay {1}" }],
        otherwise: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.",
    },
  ],
});
