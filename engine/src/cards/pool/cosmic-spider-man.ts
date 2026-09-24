import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

const KEYWORDS = ["flying", "first-strike", "trample", "lifelink", "haste"] as const;

/** "Other Spiders you control" — every permanent with the subtype, not only
 * creatures (a Kindred Spider is a Spider too), and only those there as the
 * trigger resolves (rule 611.2c): a Spider that enters later in combat
 * doesn't gain them. */
const OTHER_SPIDERS = { subtype: "Spider", controlledBy: "you" } as const;

const TRIGGER_TEXT =
  "At the beginning of combat on your turn, other Spiders you control gain flying, first strike, trample, lifelink, and haste until end of turn.";

export default defineCard({
  name: "Cosmic Spider-Man",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Human", "Hero"],
  power: 5,
  toughness: 5,
  keywords: [...KEYWORDS],
  text: `Flying, first strike, trample, lifelink, haste\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: KEYWORDS.map(
          (keyword): EffectSpec => ({
            kind: "grant-keyword-all",
            filter: OTHER_SPIDERS,
            keyword,
            duration: "end-of-turn",
            exceptSource: true,
          }),
        ),
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
