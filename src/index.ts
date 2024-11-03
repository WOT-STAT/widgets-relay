import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { app as admin, closeWs, openWs } from './admin';

const app = new Hono()
app.use(cors())
app.route('/', admin)

app.get('/', (c) => {
  const uuid = c.req.query('uuid')
  const channel = c.req.query('channel')

  if (!uuid) return c.json({ message: 'No uuid provided' }, 400)
  if (!channel) return c.json({ message: 'No channel provided' }, 400)

  const success = server.upgrade(c.req.raw, { data: { uuid, channel } });
  if (success) return new Response(null);

  return c.json({ message: 'Redirecting...' })
})

const silent = Symbol('silent')
app.get('/silent', (c) => {
  const channel = c.req.query('channel')
  if (!channel) return c.json({ message: 'No channel provided' }, 400)

  const success = server.upgrade(c.req.raw, { data: { uuid: 'silent', channel, silent } });
  if (success) return new Response(null);
  return c.json({ message: 'Redirecting...' })
})

const server = Bun.serve<{ uuid: string, channel: string, silent?: typeof silent }>({
  fetch: app.fetch,
  websocket: {
    open(ws) {
      const { channel, uuid, silent } = ws.data;
      if (silent) return ws.subscribe(channel);

      ws.subscribe(channel);
      server.publish(channel, JSON.stringify({ type: "connect", uuid }));
      openWs(channel, uuid);
    },
    message(ws, message) {
      if (message === "ping") {
        ws.send("pong");
        return;
      }
      server.publish(ws.data.channel, message);
    },
    close(ws) {
      const { channel, uuid, silent } = ws.data;
      if (silent) return ws.unsubscribe(channel);

      server.publish(channel, JSON.stringify({ type: "disconnect", uuid }));
      ws.unsubscribe(channel);
      closeWs(channel, uuid);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);