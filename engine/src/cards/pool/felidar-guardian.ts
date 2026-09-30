import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may exile another target permanent you control, then return that card to the battlefield under its owner's control.";

export default defineCard({
  name: "Felidar Guardian",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Beast"],
  power: 1,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: {} } }],
      effect: {
        kind: "may",
        prompt: "Exile that permanent and return it?",
        effect: { kind: "flicker", target: 0 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
