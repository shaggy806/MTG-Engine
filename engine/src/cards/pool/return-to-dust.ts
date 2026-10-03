import { defineCard } from "../define.js";

// "If you cast this spell during your main phase" is asked as it resolves: a
// spell cast in a main phase resolves in that same phase (a step or phase
// can't end with the stack non-empty), so "it was cast and it's now your main
// phase" is the same question. A copy wasn't cast, so it exiles only the first
// target (the ruling) — the `cast` clause. The second target may always be
// chosen; it's only exiled if the condition holds (the ruling), and then
// only if its controller still wants to as it resolves ("you may").
export default defineCard({
  name: "Return to Dust",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Exile target artifact or enchantment. If you cast this spell during your main phase, you may exile up to one other target artifact or enchantment.",
  targets: [
    { kind: "permanent", filter: { typesAnyOf: ["artifact", "enchantment"] } },
    {
      kind: "optional",
      of: {
        kind: "other",
        of: { kind: "permanent", filter: { typesAnyOf: ["artifact", "enchantment"] } },
        than: { slot: 0 },
      },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      {
        kind: "conditional",
        condition: {
          kind: "all",
          of: [
            { kind: "source", filter: { cast: true } },
            { kind: "your-turn" },
            { kind: "turn-structure", steps: ["precombat-main", "postcombat-main"] },
          ],
        },
        then: { kind: "may", prompt: "Exile the second target?", effect: { kind: "exile", target: 1 } },
      },
    ],
  },
});
