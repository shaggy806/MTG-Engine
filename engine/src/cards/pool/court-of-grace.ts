import { defineCard } from "../define.js";

const ENTER_TEXT = "When this enchantment enters, you become the monarch.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, create a 1/1 white Spirit creature token with flying. If you're the monarch, create a 4/4 white Angel creature token with flying instead.";

// The Court cycle: whether you're the monarch is read as the upkeep
// trigger resolves.
export default defineCard({
  name: "Court of Grace",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "monarch", who: "you" },
        then: { kind: "create-token", token: "4/4 Angel Token", count: 1 },
        else: { kind: "create-token", token: "Spirit Token", count: 1 },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
