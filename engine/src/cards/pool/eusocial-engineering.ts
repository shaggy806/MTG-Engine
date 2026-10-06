import { defineCard } from "../define.js";

// EDHREC rank 6607.

export default defineCard({
  name: "Eusocial Engineering",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Landfall — Whenever a land you control enters, create a 2/2 colorless Robot artifact creature token.\nWarp {1}{G} (You may cast this card from your hand for its warp cost. Exile this enchantment at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Robot Token", count: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, create a 2/2 colorless Robot artifact creature token.",
    },
  ],
  warp: { cost: "{1}{G}" },
});
