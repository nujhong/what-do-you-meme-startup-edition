interface Player {
  id: string;
  avatar: string;
  username: string;
  status?: "ready" | "in-game" | "in-game:judge";
  hand: CaptionCard[];
  trophies: PhotoCard[];
}

type PlayerStatus = "ready" | "in-game" | "in-game:judge";

interface CaptionCard {
  id: number;
  caption: string;
}

interface PhotoCard {
  id: string;
  name: string;
  url: string;
}

interface Round {
  id: number;
  players: Player[];
  photo: PhotoCard | undefined;
  submissions: [Player, CaptionCard][];
  submissionsRequired: number;
  phase: RoundPhase;
  judge: Player;
  winner: [Player, CaptionCard] | undefined;
}

type RoundPhase = "start" | "select-photo" | "select-caption" | "end";

interface Lobby {
  id: string;
  status: LobbyStatus;
  round: number;
  players: Player[];
  photos: PhotoCard[];
  captions: CaptionCard[];
}

type LobbyStatus = "waiting" | "started" | "finished";

interface ServerToClientEvents {
  "lobby:updated": (lobby: Lobby) => void;
  "round:updated": (round: Round) => void;
  "player:updated": (player: Player) => void;
  "game:started": (callback: () => void) => void;
}

interface ClientToServerEvents {
  "lobby:join": (
    player: Omit<Player, "hand" | "trophies">,
    callback: () => void
  ) => void;
  "lobby:ready": () => void;
  "lobby:leave": () => void;
  "game:view-photo-cards": (callback: (cards: PhotoCard[]) => void) => void;
  "game:select-photo": (card: PhotoCard, callback: () => void) => void;
  "game:select-random-photo": (card: null, callback: () => void) => void;
  "game:select-caption": (card: CaptionCard, callback: () => void) => void;
  "game:submit-caption": (card: CaptionCard, callback: () => void) => void;
}

interface InterServerEvents {}

interface SocketData {
  avatar: string;
  username: string;
}
