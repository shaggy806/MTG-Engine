import { defineCard } from "../define.js";

// The creatures that convoked it connive one at a time, in the order its
// controller chooses, after the destroy. One that has left the battlefield
// since still connives — its controller draws and discards — but nothing
// gets a counter (rule 701.50b, the ruling); nobody acts between a connive's
// discard and its counter (the ruling). A copy of it makes the creatures
// that convoked the original connive (rule 707.10).
const TEXT =
  "Destroy target creature or planeswalker. Each creature that convoked this spell connives. (Draw a card, then discard a card. If you discarded a nonland card, put a +1/+1 counter on that creature.)";

export default defineCard({
  name: "Lethal Scheme",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: `Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\n${TEXT}`,
  convoke: true,
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "for-each-convoker", effect: { kind: "connive", target: 0 } },
    ],
  },
});
