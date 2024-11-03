import { Hono } from "hono";

export const app = new Hono()

const TOKEN = Bun.env.ADMIN_TOKEN;

app.get('/channel-list', (c) => {
  const authorization = c.req.header('Authorization')
  if (!authorization) return c.json({ message: 'No authorization provided' }, 400)
  if (!authorization.startsWith('Bearer ')) return c.json({ message: 'Invalid authorization' }, 400)

  const token = authorization.split(' ').at(-1);
  if (token !== TOKEN) return c.json({ message: 'Invalid token' }, 401)

  const channels = [...channelMap.entries().map(([channel, clients]) => ({ channel, clients: Array.from(clients) }))];
  return c.json({ channels });
})


const channelMap = new Map<string, Set<string>>();

export function openWs(channel: string, uuid: string) {
  if (!channelMap.has(channel)) channelMap.set(channel, new Set());
  channelMap.get(channel)!.add(uuid);
}

export function closeWs(channel: string, uuid: string) {
  if (!channelMap.has(channel)) return;
  channelMap.get(channel)!.delete(uuid);
  if (channelMap.get(channel)!.size === 0) channelMap.delete(channel);
}
