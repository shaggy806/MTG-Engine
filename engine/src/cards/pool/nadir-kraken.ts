import { defineCard } from "../define.js";

// EDHREC rank 2667.
//
// Rulings:
//   [2020-01-24] You choose whether to pay {1} after drawing the card and seeing what it is. If
//     you draw multiple cards, you see them all before deciding how many of the resulting triggers
//     you'll pay {1} for.
//   [2020-01-24] If Nadir Kraken leaves the battlefield after its ability has triggered, you can
//     still pay {1} and get a Tentacle, even though you won't put a +1/+1 counter on Nadir Kraken.
//   [2020-01-24] While resolving Nadir Kraken's ability, you can't pay {1} multiple times to
//     create multiple Tentacles or to give it multiple +1/+1 counters.

const TEXT =
  "Whenever you draw a card, you may pay {1}. If you do, put a +1/+1 counter on this creature and create a " +
  "1/1 blue Tentacle creature token.";

// The {1} is paid once at most per trigger, as it resolves (the rulings). A
// Kraken that has left gets no counter, but the Tentacle is still made.
export default defineCard({
  name: "Nadir Kraken",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 2,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} for a +1/+1 counter and a Tentacle?",
        cost: "{1}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
            { kind: "create-token", token: "Tentacle Token", count: 1 },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
