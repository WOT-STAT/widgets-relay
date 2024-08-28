const server = Bun.serve<{ uuid: string, channel: string }>({
  fetch(req, server) {
    const url = new URL(req.url);

    const uuid = url.searchParams.get("uuid");
    const channel = url.searchParams.get("channel");
    if (!uuid) return new Response("No uuid provided", { status: 400 });
    if (!channel) return new Response("No channel provided", { status: 400 });

    const success = server.upgrade(req, { data: { uuid, channel } });
    if (success) return undefined;

    return new Response("Redirecting...");
  },
  websocket: {
    open(ws) {
      ws.subscribe(ws.data.channel);
      server.publish(ws.data.channel, JSON.stringify({
        type: "connect",
        uuid: ws.data.uuid,
      }));
    },
    message(ws, message) {
      if (message === "ping") {
        ws.send("pong");
        return;
      }
      server.publish(ws.data.channel, message);
    },
    close(ws) {
      server.publish(ws.data.channel, JSON.stringify({
        type: "disconnect",
        uuid: ws.data.uuid,
      }));
      ws.unsubscribe(ws.data.channel);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);