import { defineCard } from "../define.js";

const UNTAP_TEXT = "{T}: Untap another target permanent.";
const CYCLE_TEXT = "When you cycle this card, untap target permanent.";

export default defineCard({
  name: "Vizier of Tumbling Sands",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 3,
  cycling: { cost: "{1}{U}" },
  text: `${UNTAP_TEXT}\nCycling {1}{U} ({1}{U}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "other", of: "permanent" }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: ["permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
