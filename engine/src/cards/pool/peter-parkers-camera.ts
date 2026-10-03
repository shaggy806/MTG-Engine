import { defineCard } from "../define.js";

const ENTERS_TEXT = "This artifact enters with three film counters on it.";
const COPY_TEXT =
  "{2}, {T}, Remove a film counter from this artifact: Copy target activated or triggered ability you control. " +
  "You may choose new targets for the copy.";

// The rulings this follows: the copy has the original's source, modes,
// targets and X, and what was paid for the original counts for it; what's
// chosen or paid as it resolves is chosen or paid again for the copy; a
// copied linked ability is linked too. A mana ability never goes on the
// stack, so it's never a target.
export default defineCard({
  name: "Peter Parker's Camera",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: `${ENTERS_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "film", amount: 3 } },
      text: ENTERS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true, removeCounter: { kind: "film", count: 1 } },
      targets: [{ kind: "ability", whose: "you" }],
      effect: { kind: "copy-ability", target: 0, newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
