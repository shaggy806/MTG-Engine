/**
 * The wire contract between the room server and its clients, in one place
 * both workspaces import rather than each restating it.
 *
 * Two unrelated surfaces live here, kept in separate modules because they
 * really are unrelated: `room.ts` is the stateful WebSocket room protocol,
 * and `import-deck.ts` is the stateless `POST /import-deck` HTTP route.
 *
 * Everything in this package is a type. It emits no runtime code, which is
 * exactly why it can sit between a Node server and a browser bundle without
 * either one paying for it.
 */

export type {
  BotSpeed,
  ClientMessage,
  SeatCommander,
  SeatStatus,
  ServerMessage,
  WireDeck,
} from "./room.js";

export type {
  DeckFormatReport,
  ImportDeckLine,
  ImportedCardReport,
  PrintingRef,
  ReplacementOption,
} from "./import-deck.js";
