import { defineCard } from "../define.js";

const DIES_TEXT = "When this creature dies, create a number of tapped Treasure tokens equal to its power.";

// Its power as it last existed on the battlefield (rule 603.10a).
export default defineCard({
  name: "Goldvein Hydra",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["vigilance", "trample", "haste"],
  text: `Vigilance, trample, haste\nThis creature enters with X +1/+1 counters on it.\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: "This creature enters with X +1/+1 counters on it.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: { powerOf: "source" }, tapped: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
