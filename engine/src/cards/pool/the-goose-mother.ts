import { defineCard } from "../define.js";

// EDHREC rank 2939.
// Makes Food → "Food Token". X in the enters trigger is the X the spell was
// cast with (0 if it entered any other way).

const ENTERS_TEXT = "When The Goose Mother enters, create half X Food tokens, rounded up.";
const ATTACK_TEXT = "Whenever The Goose Mother attacks, you may sacrifice a Food. If you do, draw a card.";

export default defineCard({
  name: "The Goose Mother",
  manaCost: "{X}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Hydra"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\nThe Goose Mother enters with X +1/+1 counters on it.\n${ENTERS_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "The Goose Mother enters with X +1/+1 counters on it.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: { half: "x", round: "up" } },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { subtype: "Food" }, text: "Sacrifice a Food" }],
        ifDid: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
