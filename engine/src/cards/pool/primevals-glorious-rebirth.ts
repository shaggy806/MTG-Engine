import { defineCard } from "../define.js";

// EDHREC rank 2694.
//
// Rulings:
//   [2018-04-27] You must return all legendary permanent cards to the battlefield, even if the
//     “legend rule” will put some right back into your graveyard. If any abilities triggered from
//     the legendary permanents entering the battlefield, those abilities will be put onto the
//     stack after applying the “legend rule.”
//   [2018-04-27] All of the permanents put onto the battlefield this way enter at the same time.
//     If any have triggered abilities that trigger on something else entering the battlefield,
//     they'll see each other.
//   [2018-04-27] You can't cast a legendary sorcery unless you control a legendary creature or a
//     legendary planeswalker. Once you begin to cast a legendary sorcery, losing control of your
//     legendary creatures and planeswalkers won't affect that spell.
//   [2018-04-27] Other than the casting restriction, the legendary supertype on a sorcery carries
//     no additional rules. You may cast any number of legendary sorceries in a turn, and your deck
//     may contain any number of legendary cards (but no more than four of any with the same name).

const TEXT = "Return all legendary permanent cards from your graveyard to the battlefield.";

// A legendary sorcery (rule 205.4d): castable only while its caster controls
// a legendary creature or planeswalker, checked as it's cast. They all enter
// at once and see each other; the legend rule applies after (the rulings).
export default defineCard({
  name: "Primevals' Glorious Rebirth",
  manaCost: "{5}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["sorcery"],
  text: `(You may cast a legendary sorcery only if you control a legendary creature or planeswalker.)\n${TEXT}`,
  castOnlyIf: {
    kind: "controls",
    filter: { supertype: "legendary", typesAnyOf: ["creature", "planeswalker"] },
    atLeast: 1,
  },
  effect: {
    kind: "return-from-graveyard",
    filter: {
      supertype: "legendary",
      typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
    },
    destination: "battlefield",
    count: "all",
  },
});
