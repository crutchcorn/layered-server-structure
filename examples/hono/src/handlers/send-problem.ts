import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function sendProblem<Status extends ContentfulStatusCode>(
  c: Context,
  status: Status,
  message: string,
) {
  return c.json({ error: message }, status)
}
