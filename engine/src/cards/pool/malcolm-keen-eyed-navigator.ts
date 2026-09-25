import { defineCard } from "../define.js";

// #76 in top-commanders.txt.
//
// A batched damage trigger read once for the whole damage event
// (`once: "per-event"`): the trigger value is how many opponents the Pirates
// dealt damage to, combat or otherwise.
const TRIGGER_TEXT =
  "Whenever one or more Pirates you control deal damage to your opponents, you create a Treasure " +
  "token for each opponent dealt damage.";

export default defineCard({
  name: "Malcolm, Keen-Eyed Navigator",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Siren", "Pirate"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  pairing: { kind: "partner" },
  text: `Flying\n${TRIGGER_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { subtype: "Pirate" },
        to: "opponent",
        once: "per-event",
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: { triggerValue: true } },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
