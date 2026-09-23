import { defineCard } from "../define.js";

/**
 * "That player" is the drawer: the draw trigger's object is the card drawn,
 * whose controller is who drew it, so `chooser: "trigger-controller"` asks
 * them. The Treasure, if they don't pay, is still this card's controller's
 * (the `unless` effect's `otherwise` runs under its own controller).
 */
export default defineCard({
  name: "Smothering Tithe",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Whenever an opponent draws a card, that player may pay {2}. If the player doesn't, you " +
    'create a Treasure token. (It\'s an artifact with "{T}, Sacrifice this token: Add one mana of any color.")',
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "trigger-controller",
        options: [{ pay: "{2}", text: "Pay {2}" }],
        otherwise: { kind: "create-token", token: "Treasure Token", count: 1 },
      },
      resolve: null,
      text:
        "Whenever an opponent draws a card, that player may pay {2}. If the player doesn't, you " +
        "create a Treasure token.",
    },
  ],
});
