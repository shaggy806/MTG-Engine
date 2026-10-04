import { defineCard } from "../define.js";

// EDHREC rank 5718.
//
// Rulings:
//   [2023-06-16] Typecycling is a form of cycling. Any ability that triggers on a card being
//     cycled also triggers on a card being typecycled. Any ability that stops a cycling ability
//     from being activated also stops a typecycling ability from being activated.
//   [2023-06-16] Unlike the normal cycling ability, typecycling doesn't allow you to draw a card.
//     Rather, it lets you search your library for a card with the type or types indicated by the
//     ability name. For example, a card with basic landcycling lets you search for a basic land
//     card, and a card with Wizardcycling lets you search for a Wizard card.

const ETB_TEXT =
  "When Monstrosity of the Lake enters, you may pay {5}. If you do, tap all creatures your opponents control, then put a stun counter on each of those creatures.";
const theirCreatures = { type: "creature", controlledBy: "opponent" } as const;

export default defineCard({
  name: "Monstrosity of the Lake",
  manaCost: "{4}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 4,
  toughness: 6,
  text: `${ETB_TEXT} (If a permanent with a stun counter would become untapped, remove one from it instead.)\nIslandcycling {2} ({2}, Discard this card: Search your library for an Island card, reveal it, put it into your hand, then shuffle.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {5} to tap all creatures your opponents control and put a stun counter on each?",
        cost: "{5}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "tap-all", filter: theirCreatures },
            { kind: "add-counter-all", filter: theirCreatures, counter: "stun", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  cycling: { cost: "{2}", search: { subtype: "Island" } },
});
