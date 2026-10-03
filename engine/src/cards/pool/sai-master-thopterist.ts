import { defineCard } from "../define.js";

const THOPTER_TEXT =
  "Whenever you cast an artifact spell, create a 1/1 colorless Thopter artifact creature token with flying.";
const DRAW_TEXT = "{1}{U}, Sacrifice two artifacts: Draw a card.";

// "Sacrifice two artifacts" is chosen as the cost is paid — a sacrifice of
// several (`count: 2`), asked once the ability is on the stack and its mana
// paid; Sai itself isn't an artifact, so it never pays.
export default defineCard({
  name: "Sai, Master Thopterist",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 4,
  text: `${THOPTER_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: THOPTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: { filter: { type: "artifact" }, count: 2 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
