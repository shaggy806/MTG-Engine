import { defineCard } from "../define.js";

// Rulings:
//   [2019-07-12] If you cast a spell that was countered, Nightpack Ambusher's last ability
//     doesn't trigger.
//   [2019-07-12] Nightpack Ambusher looks at the entire turn to see if you have cast a spell,
//     even if Nightpack Ambusher wasn't on the battlefield when that spell was cast.
//
// "If you didn't cast a spell this turn" reads every spell you cast this turn
// (`cast-this-turn`, countered ones too), not only those cast while it was here.
const ANTHEM_TEXT = "Other Wolves and Werewolves you control get +1/+1.";
const END_TEXT =
  "At the beginning of your end step, if you didn't cast a spell this turn, create a 2/2 green Wolf creature token.";

export default defineCard({
  name: "Nightpack Ambusher",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 4,
  toughness: 4,
  keywords: ["flash"],
  text: `Flash\n${ANTHEM_TEXT}\n${END_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", subtypes: ["Wolf", "Werewolf"] },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "not", of: { kind: "cast-this-turn" } },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token", count: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
