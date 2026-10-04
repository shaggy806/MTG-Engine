import { defineCard } from "../define.js";

// EDHREC rank 5857.
//
// Historic is "artifact, legendary, or Saga" (Arbaaz Mir's `anyOf`); the
// trigger fires once for each such creature that deals combat damage to a player.

const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;
const TOKEN_TEXT =
  "Whenever a historic creature you control deals combat damage to a player, create a 1/1 black Assassin creature token with menace. (Artifacts, legendaries, and Sagas are historic.)";

export default defineCard({
  name: "Aya of Alexandria",
  manaCost: "{2}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 4,
  toughness: 3,
  keywords: ["menace", "lifelink"],
  text: `Menace, lifelink\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature", ...HISTORIC } },
      targets: [],
      effect: { kind: "create-token", token: "Assassin Token (Aya of Alexandria)", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
