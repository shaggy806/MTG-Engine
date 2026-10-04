import { defineCard } from "../define.js";

// EDHREC rank 5894.
//
// Rulings:
//   [2019-10-04] If the target creature is an illegal target when Thorn Mammoth's last ability
//     tries to resolve, the ability doesn't resolve. If Thorn Mammoth is no longer on the
//     battlefield, the target creature won't deal or be dealt damage.

const TEXT =
  "Whenever this creature or another creature you control enters, this creature fights up to one target creature you don't control.";
// Apex Altisaur's "fights up to one target creature" shape.
const fight = {
  targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
  effect: { kind: "fight", a: "source", b: 0 },
  resolve: null,
  text: TEXT,
} as const;

export default defineCard({
  name: "Thorn Mammoth",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  // "This or another creature you control" is two triggers, so it fires for
  // itself whatever it is.
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, ...fight },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      ...fight,
    },
  ],
});
