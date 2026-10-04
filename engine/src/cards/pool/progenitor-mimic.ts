import { defineCard } from "../define.js";

// EDHREC rank 5416.
//
// Rulings:
//   [2013-04-15] The original Progenitor Mimic will create tokens, but those token copies will
//     not.
//   [2013-04-15] If the chosen creature has {X} in its mana cost (such as Protean Hydra), X is
//     considered to be zero.
//   [2013-04-15] If you choose to have Progenitor Mimic enter the battlefield as a copy of a
//     creature, the triggered ability it gains will become part of its copiable values. For
//     example, suppose Progenitor Mimic enters the battlefield as a copy of Runeclaw Bear, a 2/2
//     green Bear creature with mana cost {1}{G}. The resulting object is a 2/2 green Bear creature
//     named Runeclaw Bear with mana cost {1}{G} and with “At the beginning of your upkeep, if this
//     creature isn't a token, put a token onto the battlefield that's a copy of this creature.” If
//     another Progenitor Mimic enters the battlefield as a copy of that creature, it will be a
//     Runeclaw Bear with two instances of the triggered ability.
//   [2013-04-15] Any enters-the-battlefield abilities of the copied creature will trigger when
//     Progenitor Mimic enters the battlefield. Any “as [this creature] enters the battlefield” or
//     “[this creature] enters the battlefield with” abilities of the chosen creature will also
//     work.
//   [2013-04-15] You can choose not to copy anything. In that case, Progenitor Mimic enters the
//     battlefield as a 0/0 Shapeshifter creature and is probably put into the graveyard
//     immediately.
//   [2013-04-15] If Progenitor Mimic somehow enters the battlefield at the same time as another
//     creature, it can't become a copy of that creature. You may choose only a creature that's
//     already on the battlefield.
//   [2013-04-15] If the chosen creature is a token, Progenitor Mimic copies the original
//     characteristics of that token as stated by the effect that put it onto the battlefield.
//     Copying a token doesn't make Progenitor Mimic become a token.
//   [2013-04-15] Progenitor Mimic copies exactly what was printed on the original creature and
//     nothing more (unless that creature is copying something else or is a token). It doesn't copy
//     whether that creature is tapped or untapped, whether it has any counters on it or Auras
//     attached to it, or any non-copy effects that have changed its power, toughness, types,
//     color, or so on.

const UPKEEP_TEXT =
  "At the beginning of your upkeep, if this creature isn't a token, create a token that's a copy of this creature.";
const COPY_TEXT =
  `You may have this creature enter as a copy of any creature on the battlefield, except it has "${UPKEEP_TEXT}"`;

export default defineCard({
  name: "Progenitor Mimic",
  manaCost: "{4}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 0,
  toughness: 0,
  text: COPY_TEXT,
  copyOnEnter: {
    filter: { type: "creature" },
    except: {
      triggered: [
        {
          trigger: { on: "step-begins", step: "upkeep", who: "you" },
          condition: { kind: "source", filter: { token: false } },
          targets: [],
          effect: { kind: "create-token-copy", of: "source", count: 1, who: "you" },
          resolve: null,
          text: UPKEEP_TEXT,
        },
      ],
    },
  },
});
