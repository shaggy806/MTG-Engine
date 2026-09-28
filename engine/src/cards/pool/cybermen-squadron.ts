import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// Itself included: a nonlegendary artifact creature you control.
const TEXT =
  "Nonlegendary artifact creatures you control have myriad. (Whenever a creature with myriad attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Cybermen Squadron",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Cyberman"],
  power: 5,
  toughness: 5,
  text: TEXT,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { types: ["artifact", "creature"], notSupertype: "legendary", controlledBy: "you" },
      },
      grantsTriggered: [myriad()],
      text: TEXT,
    },
  ],
});
