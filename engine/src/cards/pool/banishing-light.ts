import { defineCard } from "../define.js";

// Rule 720.2: one printed ability that exiles *and* sets up a linked delayed
// trigger, modelled as the two halves the rule describes.
export default defineCard({
  name: "Banishing Light",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "When Banishing Light enters, exile target nonland permanent an opponent " +
    "controls until Banishing Light leaves the battlefield.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text:
        "When Banishing Light enters, exile target nonland permanent an opponent " +
        "controls until Banishing Light leaves the battlefield.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When Banishing Light leaves the battlefield, return the exiled card.",
    },
  ],
});
