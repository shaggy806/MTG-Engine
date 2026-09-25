import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

export default defineCard({
  name: "Rishkar, Peema Renegade",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 2,
  text:
    "When Rishkar enters, put a +1/+1 counter on each of up to two target creatures.\n" +
    'Each creature you control with a counter on it has "{T}: Add {G}."',
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // "each of up to two target creatures" — two optional slots, and two
      // different creatures.
      targets: distinctTargets(2, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: "When Rishkar enters, put a +1/+1 counter on each of up to two target creatures.",
    },
  ],
  static: [
    {
      // "with a counter on it" — any kind, which is what `withCounter` with
      // no `kind` means.
      affects: { scope: "creatures-you-control", withCounter: {} },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "G", amount: 1 },
          resolve: null,
          text: "{T}: Add {G}.",
        },
      ],
      text: 'Each creature you control with a counter on it has "{T}: Add {G}."',
    },
  ],
});
