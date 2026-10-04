import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5798.
//
// Rulings (those that apply — the snapshot's others are Abuelo's Awakening's):
//   [2023-11-10] If a double-faced card is exiled this way, it will return with its front face up,
//     no matter which face was up when it left the battlefield.
//   [2023-11-10] The exiled card will return to the battlefield at the beginning of the next end
//     step even if Abuelo, Ancestral Echo is no longer on the battlefield at that time.
//   [2023-11-10] If a token is exiled this way, it ceases to exist and won't return to the
//     battlefield.

const TEXT =
  "{1}{W}{U}: Exile another target creature or artifact you control. Return it to the battlefield " +
  "under its owner's control at the beginning of the next end step.";

export default defineCard({
  name: "Abuelo, Ancestral Echo",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying, ward {2}\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{W}{U}", tap: false },
      targets: [
        {
          kind: "other",
          of: { kind: "permanent", whose: "you", filter: { anyOf: [{ type: "creature" }, { type: "artifact" }] } },
        },
      ],
      // Flickerwisp's shape: a delayed return that doesn't depend on Abuelo.
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
  triggered: [ward({ mana: "{2}" })],
});
