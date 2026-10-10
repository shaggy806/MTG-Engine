import { defineCard } from "../define.js";

// EDHREC rank 3853.
const TEMPT = "When this artifact enters, the Ring tempts you.";
const MANA = "{T}: Add one mana of any color.";

export default defineCard({
  name: "Inherited Envelope",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${TEMPT}\n${MANA}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "the-ring-tempts-you" },
      resolve: null,
      text: TEMPT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA,
    },
  ],
});
