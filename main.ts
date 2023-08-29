/// <reference types="./socket.d.ts" />

import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { BroadcastOperator } from "https://deno.land/x/socket_io@0.2.0/packages/socket.io/lib/broadcast-operator.ts";

// @deno-types="npm:@types/lodash@latest"
import _ from "npm:lodash@latest";

import memes from "./static/memes.json" assert { type: "json" };

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>({
  cors: { origin: "*" },
});

class GamePlayer implements Player {
  hand: CaptionCard[];
  trophies: PhotoCard[];
  status?: PlayerStatus;
  constructor(
    readonly id: string,
    readonly username: string,
    readonly avatar: string
  ) {
    this.hand = [];
    this.trophies = [];
  }

  toJSON(): Player {
    return {
      id: this.id,
      username: this.username,
      avatar: this.avatar,
      status: this.status,
      hand: this.hand,
      trophies: this.trophies,
    };
  }

  draw(deck: CaptionDeck) {
    while (this.hand.length < 7) {
      const card = deck.drawCard();
      if (card) {
        this.hand.push(card);
      }
    }
  }
}

class GameRound {
  photo?: PhotoCard;
  submissions: [Player, CaptionCard][];
  phase: RoundPhase;
  winner?: [Player, CaptionCard];

  //
  players: Map<string, GamePlayer>;
  judge: GamePlayer;

  constructor(readonly id: number, players: Map<string, GamePlayer>) {
    this.phase = "start";
    this.submissions = [];
    this.players = players;

    const judge = _.sample(Array.from(players.values()))!;

    for (const p of Array.from(players.values())) {
      if (p.id === judge.id) {
        p.status = "in-game:judge";
      } else {
        p.status = "in-game";
      }
      this.players.set(p.id, p);
    }

    this.judge = judge;
  }

  addSubmission(player: GamePlayer, card: CaptionCard) {
    this.submissions.push([player, card]);
  }

  announceWinner(player: GamePlayer, card: CaptionCard) {
    this.winner = [player, card];
  }

  toJSON(): Round {
    return {
      id: this.id,
      photo: this.photo,
      submissions: this.submissions,
      submissionsRequired: this.players.size - 1, // exclude judge
      phase: this.phase,
      players: Array.from(this.players.values()),
      judge: this.judge,
      winner: this.winner,
    };
  }
}

class Deck<T> {
  cards: T[];

  constructor(cards: T[]) {
    this.cards = cards;
    this.shuffle();
  }

  drawCard() {
    return this.cards.pop();
  }

  removeCard(card: Partial<T>) {
    return _.remove(this.cards, _.matches(card));
  }

  shuffle() {
    this.cards = _.shuffle(this.cards);
  }

  get count() {
    return this.cards.length;
  }
}

class CaptionDeck extends Deck<CaptionCard> {}

class PhotoDeck extends Deck<PhotoCard> {}

class GameLobby {
  players = new Map<string, GamePlayer>();
  round: GameRound | undefined;
  room = "1";
  roomChannel: BroadcastOperator<ServerToClientEvents, SocketData>;
  captions: CaptionDeck;
  photos: PhotoDeck;
  status: LobbyStatus;

  constructor() {
    this.status = "waiting";
    this.roomChannel = io.in(this.room);
    this.captions = new CaptionDeck(memes.captions);
    this.photos = new PhotoDeck(memes.photos);
  }

  toJSON(): Lobby {
    return {
      id: this.room,
      status: this.status,
      round: this.round?.id ?? 0,
      captions: this.captions.cards,
      photos: this.photos.cards,
      players: this.getPlayers(),
    };
  }

  getPlayers() {
    return Array.from(lobby.players.values());
  }

  addPlayer(player: GamePlayer) {
    // TODO handle players mid-way through game
    if (this.status === "waiting") {
      this.players.set(player.id, player);
      this._broadcastLobbyUpdates();
    }
  }

  removePlayer(id: string) {
    this.players.delete(id);
    this._broadcastLobbyUpdates();

    // FIXME: Super hacky to handle disconnected users
    this._broadcoastRoundUpdates();

    if (this.round?.judge.id === id) {
      this.startRound();
    }
  }

  setPlayerReady(id: string) {
    const player = this.players.get(id);

    if (player) {
      player.status = "ready";
      this.players.set(id, player);
      this._broadcastLobbyUpdates();
    }

    if (this.canStartGame) {
      this.startGame();
    }
  }

  get canStartGame() {
    const allPlayers = this.getPlayers();
    return (
      allPlayers.length >= 3 &&
      allPlayers.every((player) => player.status === "ready")
    );
  }

  startGame() {
    for (const player of this.players.values()) {
      player.status = "in-game";
    }

    this.roomChannel.emit("lobby:updated", this.toJSON());
    this.roomChannel.emit("game:started", () => {
      this.status = "started";
      this.startRound();
    });
  }

  endGame() {
    // TODO End game by broadcasting lobby status updates?
    this.roomChannel.disconnectSockets(true);
  }

  get canStartRound() {
    return !(
      this.captions.cards.length < this.players.size ||
      this.photos.cards.length < 1
    );
  }

  /**
   * Deal cards to players, a judge will be dealt with
   */
  startRound() {
    this.round = new GameRound(
      this.round ? this.round.id + 1 : 1,
      this.players
    );

    for (const player of this.getPlayers()) {
      player.draw(this.captions);
      this._sendPlayerUpdates(player);
    }

    this.photos.shuffle();
    this.round!.phase = "select-photo";
    this._broadcoastRoundUpdates();
    this._broadcastLobbyUpdates();
  }

  endRound(winner: [Player, CaptionCard]) {
    // assign trophies
    winner[0].trophies.push(this.round!.photo!);
    this.round!.winner = winner;
    this.round!.phase = "end";
    this._broadcoastRoundUpdates();

    if (this.canStartRound) {
      setTimeout(() => {
        this.startRound();
      }, 10000);
    } else {
      this.endGame();
    }
  }

  submitCaptionCard(player: GamePlayer, card: CaptionCard) {
    // Remove the caption card from hand
    player.hand.splice(
      player.hand.findIndex(({ id }) => id === card.id),
      1
    );

    this._sendPlayerUpdates(player);

    // Move the caption card to submission
    this.round!.addSubmission(player, card);
    this._broadcoastRoundUpdates();
  }

  selectCaptionCard(card: CaptionCard) {
    const winner = this.round!.submissions.find(
      (submission) => submission[1].id === card.id
    )!;

    this.endRound(winner);
  }

  selectPhotoCard(card: PhotoCard | null) {
    if (card) {
      this.round!.photo = card;
    } else {
      this.round!.photo = _.sample(Array.from(this.photos.cards))!;
    }

    _.remove(this.photos.cards, _.matches({ id: this.round!.photo.id }));

    // Move to next phase
    this.round!.phase = "select-caption";
    this._broadcoastRoundUpdates();
  }

  private _sendPlayerUpdates(player: GamePlayer) {
    io.to(player.id).emit("player:updated", player.toJSON());
  }

  private _broadcoastRoundUpdates() {
    if (this.round) {
      this.roomChannel.emit("round:updated", this.round.toJSON());
    }
  }

  private _broadcastLobbyUpdates() {
    this.roomChannel.emit("lobby:updated", this.toJSON());
  }
}

const lobby = new GameLobby();

io.on("connection", (socket) => {
  socket.join(lobby.room);

  socket
    .on("disconnect", () => {
      lobby.removePlayer(socket.id);
    })
    .on("lobby:join", (player, done) => {
      lobby.addPlayer(
        new GamePlayer(socket.id, player.username, player.avatar)
      );
      done();
    })
    .on("lobby:leave", () => {
      lobby.removePlayer(socket.id);
    })
    .on("lobby:ready", () => {
      lobby.setPlayerReady(socket.id);
    })
    .on("game:view-photo-cards", (done) => {
      done(lobby.photos.cards);
    })
    .on("game:select-photo", (card, done) => {
      lobby.selectPhotoCard(card);
      done();
    })
    .on("game:select-random-photo", (card, done) => {
      lobby.selectPhotoCard(card);

      done();
    })
    .on("game:select-caption", (card, done) => {
      lobby.selectCaptionCard(card);
      done();
    })
    .on("game:submit-caption", (card, done) => {
      const player = lobby.players.get(socket.id);
      lobby.submitCaptionCard(player!, card);
      done();
    });
});

await serve(io.handler(), { port: 8080 });
