import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

// "If it was attacking" reads the token as it last existed on the battlefield
// (rule 603.10a): a mobilized Warrior dying in combat draws, one sacrificed at
// the end step — combat over — drains. It triggers for each token leaving
// with Zurgo too (ruling).
const MOBILIZE_TEXT =
  "Mobilize 1 (Whenever this creature attacks, create a tapped and attacking 1/1 red Warrior creature token. Sacrifice it at the beginning of the next end step.)";
const LEAVE_TEXT =
  "Whenever a creature token you control leaves the battlefield, draw a card if it was attacking. Otherwise, each opponent loses 1 life.";

export default defineCard({
  name: "Zurgo Stormrender",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${MOBILIZE_TEXT}\n${LEAVE_TEXT}`,
  triggered: [
    mobilize(1),
    {
      trigger: { on: "leaves-battlefield", who: "you-control", filter: { type: "creature", token: true } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { attacking: true } },
        then: { kind: "draw", amount: 1 },
        else: { kind: "lose-life", amount: 1, who: "each-opponent" },
      },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
