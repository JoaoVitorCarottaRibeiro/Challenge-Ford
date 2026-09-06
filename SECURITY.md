# Segurança — Ford Pickup Intel

## Modelo de proteção de escrita

Toda rota de escrita (`POST`/`DELETE`) exige um JWT válido (`Authorization: Bearer`) com role
`admin` (`authenticate` + `requireRole('admin')`, `apps/api/src/middlewares/rbac.ts`). Não há mais
assinatura HMAC adicional — ela existiu numa versão anterior, mas o segredo compartilhado
(`NEXT_PUBLIC_HMAC_SECRET`) ia embutido no bundle JS do cliente, então qualquer pessoa conseguia
extrair a chave e assinar requisições arbitrárias. Não protegia contra nada realista; foi removida
para não passar uma falsa sensação de segurança.

## Segredos

- Nenhum segredo real deve ficar em arquivo versionado. `.env` / `.env.local` são gitignored;
  `.env.example` (raiz e `apps/api/`) só tem placeholders.
- A API valida a env no boot (`apps/api/src/config/env.ts`) — não sobe com `JWT_SECRET` curto,
  `ENCRYPTION_KEY` que não decodifica pra 32 bytes, ou qualquer segredo obrigatório ausente.
- Em deploy, segredos vivem **só** no painel da plataforma (Render, Vercel, etc.) — nunca em
  arquivo copiado pra imagem. O `.dockerignore` na raiz garante que `.env` não entra no build
  Docker mesmo que exista localmente.
- Gere segredos fortes com `openssl rand -hex N` (ver comentários em `apps/api/.env.example`).

## Exposição histórica conhecida

O commit inicial (`6496ffe`) deste repositório incluiu, no `.env.example` da raiz, credenciais reais
do Oracle FIAP (`DB_USER=rm558396`, `DB_PASS=190305`). Isso foi corrigido nos arquivos atuais (os
`.env.example` de hoje só têm placeholders), mas **a credencial antiga continua no histórico do
git** até alguém reescrever aquele commit.

Mitigação aplicada: parar de commitar (feito). Mitigação pendente, a critério do time:
- A senha do Oracle FIAP provavelmente não pode ser rotacionada pelo aluno — é atribuída pela
  instituição.
- Reescrever o histórico (`git filter-repo --replace-text`, ou — mais simples, já que é um repo
  novo de um único commit — recriar o commit inicial com `git rm -r --cached . && git add . && git
  commit --amend` seguido de `push --force`) remove a string do histórico, mas exige que qualquer
  colaborador com clone existente re-clone depois. **Não fazer sem avisar o time antes.**

## Oracle FIAP é compartilhado

O `DB_USER` é o login da equipe inteira, não individual. Rodar a API local ao mesmo tempo que um
colega (ou que uma instância já deployada) disputa o mesmo limite de conexão do Oracle FIAP e pode
causar falhas intermitentes e difíceis de diagnosticar em queries que abrem conexão nova. Antes de
investigar um 500 esquisito, confirme que só uma instância está conectada ao banco por vez.
