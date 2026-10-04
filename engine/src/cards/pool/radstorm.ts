import { defineCard } from "../define.js";

// EDHREC rank 3085.
//
// Rulings:
//   [2024-03-08] A copy of a spell can be countered like any other spell, but it must be countered
//     individually. Countering a spell with storm won’t affect the copies.
//   [2024-03-08] Some spells and abilities that cause you to proliferate may require targets. If
//     each target chosen is an illegal target as that spell or ability tries to resolve, it won’t
//     resolve. You won’t proliferate.
//   [2024-03-08] Spells cast from zones other than a player’s hand and spells that were countered
//     or otherwise failed to resolve are counted by the storm ability.
//   [2024-03-08] The copies of Radstorm created by its storm ability are put directly onto the
//     stack. They aren’t cast and won’t be counted by other spells with storm cast later in the
//     turn.
//   [2024-03-08] You don’t have to choose every permanent or player that has a counter—only the
//     ones you want to add counters to. Since “any number” includes zero, you don’t have to choose
//     any permanents at all, and you don’t have to choose any players at all.
//   [2024-03-08] Players can respond to a spell or ability whose effect includes proliferating.
//     Once that spell or ability starts to resolve, however, and its controller chooses which
//     permanents and players will get new counters, it’s too late for anyone to respond.
//   [2024-03-08] If a player or permanent has more than one kind of counter on it, and you choose
//     for it to get additional counters, it must get one of each kind of counter it already has.
//     You can’t have it get just one kind of counter it already has and not the others.
//   [2024-03-08] You can choose any permanent that has a counter, including ones controlled by
//     opponents. You can choose any player who has a counter, including opponents. You can’t
//     choose cards in any zone other than the battlefield, even if they have counters on them.

const STORM_TEXT = "Storm (When you cast this spell, copy it for each spell cast before it this turn.)";

export default defineCard({
  name: "Radstorm",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `${STORM_TEXT}\nProliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)`,
  effect: { kind: "proliferate" },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: STORM_TEXT,
    },
  ],
});
