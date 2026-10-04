import { defineCard } from "../define.js";

// EDHREC rank 4945.
//
// Rulings:
//   [2020-11-10] If the creature you control is an illegal target as Ancient Animus tries to
//     resolve, you won't put a +1/+1 counter on it. If that creature is a legal target but the
//     creature you don't control isn't, you'll still put the counter on the creature you control
//     if it's legendary.
//   [2020-11-10] If either target is an illegal target as Ancient Animus tries to resolve, neither
//     creature will deal or be dealt damage.
//
// An illegal target's slot is blank as the spell resolves (rule 608.2b), so
// the "target" condition reads false for it and `fight` needs both slots.
export default defineCard({
  name: "Ancient Animus",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature you control if it's legendary. Then it fights target creature an opponent controls. (Each deals damage equal to its power to the other.)",
  targets: ["creature-you-control", "creature-an-opponent-controls"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { supertype: "legendary" } },
        then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      },
      { kind: "fight", a: 0, b: 1 },
    ],
  },
});
