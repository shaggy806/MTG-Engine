import { defineCard } from "../define.js";

export default defineCard({
  name: "Scavenging Ooze",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 2,
  toughness: 2,
  text: "{G}: Exile target card from a graveyard. If it was a creature card, put a +1/+1 counter on this creature and you gain 1 life.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [{ kind: "card-in-graveyard" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          {
            // "If it *was* a creature card" — asked after the exile, which is
            // fine: the filter reads printed characteristics, and those don't
            // change with the zone.
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { type: "creature" } },
            then: {
              kind: "sequence",
              effects: [
                { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
                { kind: "gain-life", amount: 1 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: "{G}: Exile target card from a graveyard. If it was a creature card, put a +1/+1 counter on this creature and you gain 1 life.",
    },
  ],
});
