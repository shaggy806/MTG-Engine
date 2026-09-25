import { defineCard } from "../define.js";
import { dethrone } from "../helpers.js";

// #156 in top-commanders.txt.
//
// "That card" rides forward on the delayed trigger as its trigger object; it
// is found only if it's still the card that died (gone from the graveyard
// and back is a new object, rule 400.7). Marchesa dying with a counter on
// her counts too.
const GRANT_TEXT = "Other creatures you control have dethrone.";
const RETURN_TEXT =
  "Whenever a creature you control with a +1/+1 counter on it dies, return that card to the " +
  "battlefield under your control at the beginning of the next end step.";

export default defineCard({
  name: "Marchesa, the Black Rose",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text:
    "Dethrone (Whenever this creature attacks the player with the most life or tied for most " +
    `life, put a +1/+1 counter on it.)\n${GRANT_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantsTriggered: [dethrone()],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    dethrone(),
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
        text: "Return that card to the battlefield under your control.",
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
