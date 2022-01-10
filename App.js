// Importing minified kaboom.js
import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";

// Initialize the twilio sync /token function
async function initSync() {
  const response = await fetch("FUNCTION_URL", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identity: "user" }),
    mode: "cors",
  });
  const data = await response.json();
  const syncClient = new Twilio.Sync.Client(data.token);
  return syncClient;
}

// Initialize newly joining players
async function initPlayers(syncClient) {
  syncClient
    .list("lhd")
    .then(async (list) => {
      const player1 = await initSelf(syncClient);
      list.push({ sid: player1.sid }).catch((err) => {
        console.error("Failed to add self to list", err);
      });

      const pageHandler = (paginator) => {
        paginator.items.forEach((item) => {
          if (item.data.sid !== player1.sid) {
            initPlayer(item.data.sid, syncClient);
          }
        });
        return paginator.hasNextPage
          ? paginator.nextPage().then(pageHandler)
          : null;
      };

      list
        .getItems({ from: 0, order: "asc" })
        .then(pageHandler)
        .catch((error) => {
          console.error("List getItems() failed", error);
        });

      list.on("itemAdded", (event) => {
        const item = event.item.data;
        if (item.sid !== player1.sid) {
          initPlayer(item.sid, syncClient);
        }
      });
      list.on("itemRemoved", (event) => {});
    })
    .catch((err) => {
      console.error("unexpected error", err);
    });
}

// Initialize self
async function initSelf(syncClient) {
  const stream = await syncClient.stream();
  const player = add([
    rect(40, 40),
    pos(Math.random() * width(), Math.random() * height()),
    outline(2),
    color(255, 0, 0),
    area(),
    body(),
    stream.sid,
  ]);

  onKeyPress("w", () => {
    player.jump();
    stream.publishMessage({ x: player.pos.x, y: player.pos.y, key: "w" });
  });

  onKeyDown("d", () => {
    player.move(200, 0);
    stream.publishMessage({ x: player.pos.x, y: player.pos.y, key: "d" });
  });

  onKeyDown("a", () => {
    player.move(-200, 0);
    stream.publishMessage({ x: player.pos.x, y: player.pos.y, key: "a" });
  });

  return stream;
}

// Initialize player
async function initPlayer(sid, syncClient) {
  syncClient
    .stream(sid)
    .then((stream) => {
      const player = add([
        rect(40, 40),
        pos(0, 0),
        color(Math.random() * 255, Math.random() * 255, Math.random() * 255),
        area(),
        body(),
        opacity(0),
        stream.sid,
      ]);
      stream.on("messagePublished", (event) => {
        const data = event.message.data;
        if (player.opacity === 0) {
          player.pos.x = data.x;
          player.pos.y = data.y;
          player.opacity = 100;
          player.outline = 2;
        } else if (data.key === "w") {
          // Add key handling
          player.jump();
        } else if (data.key === "a") {
          player.move(-200, 0);
        } else if (data.key === "d") {
          player.move(200, 0);
        }
      });
    })
    .catch((err) => {
      console.error("Unexpected error", err);
    });
}

// initialize kaboom context
const syncClient = await initSync();
kaboom({
  width: 800,
  height: 600,
});
gameSetup();
initPlayers(syncClient);

function gameSetup() {
  add([text("Jump!"), pos(120, 80)]);

  add([
    rect(width(), 48),
    pos(0, height() - 48),
    outline(4),
    area(),
    solid(),
    color(127, 200, 255),
  ]);
}