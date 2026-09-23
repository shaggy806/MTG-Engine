import { defineCard } from "../define.js";

/** "Up to one target artifact or enchantment" — any player's, your own
 * included, and optional even when there's only one. */
export default defineCard({
  name: "Loran of the Third Path",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 1,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "When Loran enters, destroy up to one target artifact or enchantment.\n" +
    "{T}: You and target opponent each draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "artifact-or-enchantment" }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When Loran enters, destroy up to one target artifact or enchantment.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "draw", amount: 1, target: 0 },
        ],
      },
      resolve: null,
      text: "{T}: You and target opponent each draw a card.",
    },
  ],
});
