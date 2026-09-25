import { defineCard } from "../define.js";

/** Kibo, Uktabi Prince's colorless Banana artifact. */
const TEXT = "{T}, Sacrifice this token: Add {R} or {G}. You gain 2 life.";

export default defineCard({
  name: "Banana Token",
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["R", "G"] },
        amount: 1,
        also: { kind: "gain-life", amount: 2 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
