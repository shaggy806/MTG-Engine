import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #189 in top-commanders.txt. A modal DFC; the back face is Tergrid's Lantern.
//
// One printed ability with two events — an opponent sacrificing a nontoken
// permanent, and an opponent discarding a permanent card (once per card).
// "That card" is the trigger object, found only in the graveyard it went to.
const TRIGGER_TEXT =
  "Whenever an opponent sacrifices a nontoken permanent or discards a permanent card, you may put " +
  "that card from a graveyard onto the battlefield under your control.";
const takeIt: EffectSpec = {
  kind: "may",
  prompt: "Put that card onto the battlefield under your control?",
  effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
};

export default defineCard({
  name: "Tergrid, God of Fright",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "opponent", filter: { token: false } },
      targets: [],
      effect: takeIt,
      resolve: null,
      text: TRIGGER_TEXT,
    },
    {
      trigger: {
        on: "discards",
        who: "opponent",
        perCard: true,
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
      },
      targets: [],
      effect: takeIt,
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  faces: ["Tergrid, God of Fright", "Tergrid's Lantern"],
});
