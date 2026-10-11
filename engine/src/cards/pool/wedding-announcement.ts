import { defineCard } from "../define.js";

// EDHREC rank 6695.
//
// Rulings:
//   - Wedding Announcement keeps its invitation counters as it transforms into
//     Wedding Festivity. (It transforms in place: the same permanent, rule 712.)
//   - Transforming is part of the triggered ability: if some other effect gives
//     it three or more invitation counters, it won't transform until the next
//     time this ability resolves. (The counter check is the last step of the
//     resolution, Hadana's Climb's shape.)
//   - "If you attacked with two or more creatures this turn" looks back at the
//     whole turn, even to before it was on the battlefield, and counts
//     creatures that have since left or stopped being creatures — the
//     `attackers` turn stat (Windbrisk Heights): each creature declared as an
//     attacker this turn, once.
const TEXT =
  "At the beginning of your end step, put an invitation counter on this enchantment. If you attacked with two or more creatures this turn, draw a card. Otherwise, create a 1/1 white Human creature token. Then if this enchantment has three or more invitation counters on it, transform it.";

export default defineCard({
  name: "Wedding Announcement",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "invitation", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "turn-stat", stat: "attackers", who: "you", atLeast: 2 },
            then: { kind: "draw", amount: 1 },
            else: { kind: "create-token", token: "Human Token", count: 1 },
          },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "invitation", compare: { op: "gte", n: 3 } },
            then: { kind: "transform", target: "source" },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
  faces: ["Wedding Announcement", "Wedding Festivity"],
  transform: true,
});
