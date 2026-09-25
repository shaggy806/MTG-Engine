import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// #288 in top-commanders.txt.
//
// "You investigate X times, where X is one plus the number of opponents who
// investigated this way" is one investigate for you, then one more per
// opponent who did (`ifDid`, applied once per such opponent).
const TEXT =
  "When Wernog, Rider's Chaplain enters or leaves the battlefield, each opponent may investigate. " +
  "Each opponent who doesn't loses 1 life. You investigate X times, where X is one plus the number " +
  "of opponents who investigated this way.";
const effect = {
  kind: "sequence",
  effects: [
    {
      kind: "each-player-may",
      who: "each-opponent",
      prompt: "Investigate?",
      effect: investigate(),
      ifDidnt: { kind: "lose-life", amount: 1, who: "that-player" },
      ifDid: investigate(),
    },
    investigate(),
  ],
} as const;

export default defineCard({
  name: "Wernog, Rider's Chaplain",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 2,
  pairing: { kind: "partner-group", group: "Friends forever" },
  text: `${TEXT}\nPartner—Friends forever (You can have two commanders if both have this ability.)`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect, resolve: null, text: TEXT },
    { trigger: { on: "leaves-battlefield", who: "self" }, targets: [], effect, resolve: null, text: TEXT },
  ],
});
