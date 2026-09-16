import { defineCard } from "../define.js";

export default defineCard({
  name: "Conclave Tribunal",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Convoke\n" +
    "When Conclave Tribunal enters, exile target nonland permanent an opponent " +
    "controls until Conclave Tribunal leaves the battlefield.",
  convoke: true,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text:
        "When Conclave Tribunal enters, exile target nonland permanent an opponent " +
        "controls until Conclave Tribunal leaves the battlefield.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When Conclave Tribunal leaves the battlefield, return the exiled card.",
    },
  ],
});
