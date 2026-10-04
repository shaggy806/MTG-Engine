import { defineCard } from "../define.js";

// EDHREC rank 5025.
//
// Rulings:
//   [2022-09-09] The token copies exactly what is printed on the permanent and nothing else
//     (unless that creature is copying something else or is a token; see below). It doesn’t copy
//     whether that creature is tapped or untapped, whether it has any counters on it or Auras
//     and/or Equipment attached to it, or any non-copy effects that changed its power, toughness,
//     types, color, and so on.
//   [2022-09-09] If the copied permanent is copying something else, the token enters the
//     battlefield as whatever that permanent is copying.
//   [2022-09-09] If the legendary permanent that entered the battlefield is no longer on the
//     battlefield, no longer under the same player’s control, or no longer legendary when the
//     triggered ability resolves, the ability’s controller may still pay {1} to copy it. If it’s
//     no longer on the battlefield, use its copiable characteristics as it last existed on the
//     battlefield to determine the characteristics of the token copy.
//   [2022-09-09] Any enters-the-battlefield abilities of the copied permanent will trigger when
//     the token enters the battlefield. Any “As [this permanent] enters the battlefield” or “[This
//     permanent] enters the battlefield with” abilities of the copied permanent will also work.
//   [2022-09-09] If, while you control Cadric, Soul Kindler, you also control a token legendary
//     permanent and a single nontoken legendary permanent with the same name, the legend rule will
//     not cause you to put either one into your graveyard.
//   [2022-09-09] If the copied permanent has {X} in its mana cost, X is 0.
//   [2022-09-09] If, while you control Cadric, Soul Kindler, you also control more than one
//     nontoken legendary permanent with the same name and at least one token legendary permanent
//     with that name, the legend rule applies to only the nontoken permanents. You must choose one
//     of the nontoken permanents to keep and put the rest of the nontoken permanents with that
//     name into your graveyard. You may not choose one of the token permanents and you may not put
//     any of the tokens into your graveyard this way.

export default defineCard({
  name: "Cadric, Soul Kindler",
  manaCost: "{2}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Wizard"],
  power: 4,
  toughness: 3,
  text: "The \"legend rule\" doesn't apply to tokens you control.\nWhenever another nontoken legendary permanent you control enters, you may pay {1}. If you do, create a token that's a copy of it. That token gains haste. Sacrifice it at the beginning of the next end step.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, supertype: "legendary" },
        otherOnly: true,
      },
      targets: [],
      // Inalla, Archmage Ritualist's shape: {1} once per resolution; a
      // permanent that has left is copied as it last existed (the ruling),
      // and the token is yours whoever controls it now. "That token gains
      // haste" isn't a copy exception (Orthion's `gains`).
      effect: {
        kind: "may",
        prompt: "Pay {1} to create a token copy of that permanent?",
        cost: "{1}",
        effect: {
          kind: "create-token-copy",
          of: "trigger-object",
          count: 1,
          who: "you",
          gains: { keywords: ["haste"] },
          sacrificeAtEndStep: true,
        },
      },
      resolve: null,
      text: "Whenever another nontoken legendary permanent you control enters, you may pay {1}. If you do, create a token that's a copy of it. That token gains haste. Sacrifice it at the beginning of the next end step.",
    },
  ],
  static: [
    {
      // Exempts only the tokens: a token and a nontoken of one name both
      // stay, and nontokens still face the rule among themselves (the rulings).
      affects: { scope: "filter", filter: { controlledBy: "you", token: true } },
      legendRuleOff: true,
      text: "The \"legend rule\" doesn't apply to tokens you control.",
    },
  ],
});
