import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, you may exile target non-Angel creature you control, then return " +
  "that card to the battlefield under your control.";

export default defineCard({
  name: "Restoration Angel",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", notSubtypes: ["Angel"] } }],
      effect: {
        kind: "may",
        prompt: "Exile the creature and return it?",
        effect: { kind: "flicker", target: 0, underYourControl: true },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
