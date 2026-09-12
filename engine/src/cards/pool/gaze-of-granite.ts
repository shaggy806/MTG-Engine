import { defineCard } from "../define.js";

/** Awaken (rule 702.113) isn't modeled — the alternate awaken cost / land
 * animation clause is dropped, same as this card's other omitted lines. */
export default defineCard({
  name: "Gaze of Granite",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy each creature with mana value X or less.",
  resolve: (ctx) => {
    ctx.destroyAll({ type: "creature", manaValue: { op: "lte", n: ctx.x } });
  },
});
