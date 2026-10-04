import { defineCard } from "../define.js";

// EDHREC rank 4578.

const CONSTELLATION =
  "Constellation — Whenever this enchantment or another enchantment you control enters, put a blessing counter on this enchantment.";
const PUMP = "Creatures you control get +1/+1 for each blessing counter on this enchantment.";
const BLESS = { kind: "add-counter", target: "source", counter: "blessing", amount: 1 } as const;

export default defineCard({
  name: "Boon of the Spirit Realm",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${CONSTELLATION}\n${PUMP}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: BLESS, resolve: null, text: CONSTELLATION },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" }, otherOnly: true },
      targets: [],
      effect: BLESS,
      resolve: null,
      text: CONSTELLATION,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you" } },
      grantPtPerCount: { countersOnSource: "blessing", pt: [1, 1] },
      text: PUMP,
    },
  ],
});
