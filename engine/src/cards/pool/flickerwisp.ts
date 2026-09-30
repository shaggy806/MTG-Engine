import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, exile another target permanent. Return that card to the battlefield under its owner's control at the beginning of the next end step.";

// A token exiled this way ceases to exist and never returns.
export default defineCard({
  name: "Flickerwisp",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "other", of: "permanent" }],
      effect: {
        kind: "flicker",
        target: 0,
        returnAt: "next-end-step",
        returnText: "Return the exiled card to the battlefield under its owner's control.",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
