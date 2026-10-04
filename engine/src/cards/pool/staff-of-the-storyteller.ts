import { defineCard } from "../define.js";

// EDHREC rank 3063.
// Makes Spirit → uses "Spirit Token".
//
// "Whenever you create one or more creature tokens" is a batched entry of
// creature tokens under your control (Marneus Calgar's shape): a token enters
// under the control of the player who created it (rule 111.2), and one
// creation is one simultaneous entry, so it fires once per creation however
// many tokens it makes. Its own enters token counts too.
const ENTER_TEXT = "When this artifact enters, create a 1/1 white Spirit creature token with flying.";
const STORY_TEXT = "Whenever you create one or more creature tokens, put a story counter on this artifact.";
const DRAW_TEXT = "{W}, {T}, Remove a story counter from this artifact: Draw a card.";

export default defineCard({
  name: "Staff of the Storyteller",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["artifact"],
  text: `${ENTER_TEXT}\n${STORY_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{W}", tap: true, removeCounter: { kind: "story", count: 1 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", token: true },
        batched: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "story", amount: 1 },
      resolve: null,
      text: STORY_TEXT,
    },
  ],
});
