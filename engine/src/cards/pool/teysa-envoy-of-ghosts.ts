import { defineCard } from "../define.js";

// EDHREC rank 6622.
// Makes Spirit → "Spirit Token (White-Black)".
//
// Rulings:
//   [2013-04-15] Teysa's last ability doesn't target the creature. It will destroy a creature with
//     hexproof or protection from white, for example.
//   [2013-04-15] Teysa's controller gets the Spirit creature token, not the controller of the
//     creature that dealt combat damage.
//   [2013-07-01] You get a Spirit creature token even if Teysa's triggered ability doesn't destroy
//     the creature (perhaps because it regenerated or has indestructible).
//
// Strixhaven Stadium's trigger: one per creature that deals combat damage to
// you, with that creature as the trigger object (destroyed untargeted); the
// token is made whether or not the destroy did anything.

const TRIGGER_TEXT =
  "Whenever a creature deals combat damage to you, destroy that creature. Create a 1/1 white and black Spirit creature token with flying.";

export default defineCard({
  name: "Teysa, Envoy of Ghosts",
  manaCost: "{5}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance, protection from creatures\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      protection: { types: ["creature"] },
      text: "Protection from creatures",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "any", filter: { type: "creature" }, to: "you", combat: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: "trigger-object" },
          { kind: "create-token", token: "Spirit Token (White-Black)", count: 1 },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
