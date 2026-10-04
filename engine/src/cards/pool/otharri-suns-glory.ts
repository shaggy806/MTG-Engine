import { defineCard } from "../define.js";

// EDHREC rank 2915.
//
// Rulings:
//   [2023-02-04] Tapping a Rebel you control is part of the cost to activate the last ability of
//     Otharri, Suns' Glory while it is in the graveyard. Once a player has begun to activate the
//     ability, other players may not respond by removing that Rebel from the battlefield to
//     prevent it from being tapped.
// The graveyard ability doesn't exile the card as a cost (`staysInZone`, as
// Reassembling Skeleton's), and the Rebel is tapped as the cost is paid.
const ATTACK_TEXT =
  "Whenever Otharri attacks, you get an experience counter. Then create a 2/2 red Rebel creature token that's tapped and attacking for each experience counter you have.";
const RETURN_TEXT =
  "{2}{R}{W}, Tap an untapped Rebel you control: Return this card from your graveyard to the battlefield tapped.";

export default defineCard({
  name: "Otharri, Suns' Glory",
  manaCost: "{3}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phoenix"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "lifelink", "haste"],
  text: `Flying, lifelink, haste\n${ATTACK_TEXT}\n${RETURN_TEXT}`,
  activated: [
    {
      cost: {
        mana: "{2}{R}{W}",
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Rebel", controlledBy: "you" } },
      },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-player-counters", counter: "experience", amount: 1 },
          {
            kind: "create-token",
            token: "Rebel Token",
            count: { playerCounters: "experience" },
            tapped: true,
            attacking: "choose",
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
