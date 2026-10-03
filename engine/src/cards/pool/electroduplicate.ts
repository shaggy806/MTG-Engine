import { defineCard } from "../define.js";

const SACRIFICE_TEXT = "At the beginning of the end step, sacrifice this token.";
const TEXT =
  `Create a token that's a copy of target creature you control, except it has haste and "${SACRIFICE_TEXT}"`;

// Haste and the end-step trigger are copy exceptions — copiable values (rule
// 707.9b), so a copy of the token has them too. "The end step" is every end
// step, not only its controller's: a token that changes hands, or a copy of
// it made in another player's turn, is gone at that turn's end step.
export default defineCard({
  name: "Electroduplicate",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{2}{R}{R}" },
  text: `${TEXT}\nFlashback {2}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)`,
  targets: ["creature-you-control"],
  effect: {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    exceptions: {
      keywords: ["haste"],
      triggered: [
        {
          trigger: { on: "step-begins", step: "end", who: "any" },
          targets: [],
          effect: { kind: "sacrifice-source" },
          resolve: null,
          text: SACRIFICE_TEXT,
        },
      ],
    },
  },
});
