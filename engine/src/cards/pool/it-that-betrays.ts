import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

const TEXT = "Whenever an opponent sacrifices a nontoken permanent, put that card onto the battlefield under your control.";

// Tergrid's first trigger without the "may": you must return it (its
// ruling), from whichever graveyard it went to. "That card" is found only
// there, so one that has left the graveyard since stays where it is.
export default defineCard({
  name: "It That Betrays",
  manaCost: "{12}",
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 11,
  toughness: 11,
  text:
    "Annihilator 2 (Whenever this creature attacks, defending player sacrifices two permanents of their choice.)\n" +
    TEXT,
  triggered: [
    annihilator(2),
    {
      trigger: { on: "sacrifice", who: "opponent", filter: { token: false } },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
