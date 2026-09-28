import { defineCard } from "../define.js";

// Once per non-Human attacker, each resolving on its own: six cards looked at
// each time, not eighteen at once (ruling). The Human's target is its
// controller's choice, not necessarily what the non-Human attacks (ruling;
// rule 508.4), and a "can't attack" effect doesn't stop it (508.4c).
const ATTACK_TEXT =
  "Whenever a non-Human creature you control attacks, look at the top six cards of your library. You may put a Human creature card from among them onto the battlefield tapped and attacking. It gains indestructible until end of turn. Put the rest of the cards on the bottom of your library in a random order.";

export default defineCard({
  name: "Winota, Joiner of Forces",
  manaCost: "{2}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 4,
  text: ATTACK_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature", notSubtypes: ["Human"] } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "bottom-random",
        filter: { type: "creature", subtype: "Human" },
        enterTapped: true,
        attacking: "choose",
        then: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
