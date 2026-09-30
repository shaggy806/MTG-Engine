import { defineCard } from "../define.js";

export default defineCard({
  name: "Duty Beyond Death",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Creatures you control gain indestructible until end of turn. Put a +1/+1 counter on each creature you control. (Damage and effects that say \"destroy\" don't destroy those creatures.)",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
    ],
  },
});
