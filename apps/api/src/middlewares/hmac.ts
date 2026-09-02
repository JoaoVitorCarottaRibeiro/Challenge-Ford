import { createHmac } from 'crypto'
import { FastifyRequest, FastifyReply } from 'fastify'

const HMAC_SECRET = process.env.HMAC_SECRET!

/**
 * Verifica assinatura HMAC-SHA256 do payload.
 * O cliente deve enviar o header X-Signature: sha256=<hash>
 * calculado com HMAC-SHA256 do body usando o segredo compartilhado.
 */
export async function verifyHmac(req: FastifyRequest, reply: FastifyReply) {
  const signature = req.headers['x-signature'] as string

  if (!signature || !signature.startsWith('sha256=')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Header X-Signature ausente ou malformado'
    })
  }

  const receivedHash = signature.replace('sha256=', '')
  const body = JSON.stringify(req.body)
  const expectedHash = createHmac('sha256', HMAC_SECRET)
    .update(body)
    .digest('hex')

  if (receivedHash !== expectedHash) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Assinatura do payload inválida — possível manipulação em trânsito'
    })
  }
}