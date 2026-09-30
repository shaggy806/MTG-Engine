import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

const TEXT =
  "Lieutenant — At the beginning of combat on your turn, if you control your commander, target nonlegendary creature you control gains myriad until end of turn. (Whenever it attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Ironwill Forger",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Orc", "Artificer"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "controls", filter: { isCommander: true, ownedBy: "you" }, atLeast: 1 },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", notSupertype: "legendary" } }],
      effect: { kind: "grant-triggered", target: 0, ability: myriad(), duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
