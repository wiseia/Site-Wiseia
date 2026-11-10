# Subdomínios dos clientes do Ciclo: não indexar (noindex + robots)

Escopo: `ebb.wiseia.com.br`, `suleste.wiseia.com.br`, `admin.wiseia.com.br`.
**Fora do escopo:** `med.` e `admin-med.` (estão sendo corrigidos pela VPS).

## O que foi encontrado (2026-11-10)

| Subdomínio | `/` | `/robots.txt` | `noindex` na tela de login | `X-Robots-Tag` |
|---|---|---|---|---|
| ebb. | 307 → `/login?redirect=%2F` | **404** | **não tem** | não |
| suleste. | 307 → `/login?redirect=%2F` | **404** | **não tem** | não |
| admin. | 307 → `/login` | **307 → `/login`** (o middleware captura até o robots) | **não tem** | não |

Stack observada: nginx 1.18 (Ubuntu) na frente de um app Next.js (App Router; Next 15 pelo formato da página 404). Só a página 404 tem `<meta name="robots" content="noindex">`; a tela de login, que é o que o Google recebe, não tem.

## Ordem recomendada (importante)

`Disallow: /` **impede o Google de ler o `noindex`**. Se uma tela já foi indexada, ela pode ficar listada ("indexada, mas bloqueada pelo robots.txt").

1. **Fase 1:** aplicar só o `X-Robots-Tag` (e a meta no Next). Esperar o Google reprocessar (dias a poucas semanas; acompanhar no Search Console, "Páginas").
2. **Fase 2:** só depois publicar o `robots.txt` com `Disallow: /`.

Se preferir aplicar tudo de uma vez, funciona para impedir novas indexações, mas não garante remover as já existentes.

---

## A) nginx (um bloco por subdomínio)

Arquivo típico: `/etc/nginx/sites-available/<subdominio>` (o que tem `server_name ebb.wiseia.com.br;`). Repetir em `suleste.` e `admin.`.

```nginx
server {
    server_name ebb.wiseia.com.br;          # suleste.wiseia.com.br / admin.wiseia.com.br
    # ... listen, ssl_certificate etc. já existentes ...

    # FASE 1: nenhuma resposta (inclusive erros e redirecionamentos) deve ser indexada
    add_header X-Robots-Tag "noindex, nofollow" always;

    # FASE 2: robots.txt servido pelo nginx, antes do app e do middleware de login
    location = /robots.txt {
        default_type text/plain;
        add_header X-Robots-Tag "noindex, nofollow" always;   # repetir aqui (ver aviso abaixo)
        return 200 "User-agent: *\nDisallow: /\n";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;     # o que já existe
        # ... proxy_set_header etc. já existentes ...
        add_header X-Robots-Tag "noindex, nofollow" always;   # repetir aqui se este bloco tiver outro add_header
    }
}
```

**Aviso:** no nginx, se um bloco `location` declara *qualquer* `add_header`, ele **descarta** os `add_header` herdados do `server`. Por isso repetir a linha em cada `location` que já tenha `add_header` próprio. Se o `location /` atual não tiver nenhum `add_header`, a linha do nível `server` já basta.

Se o Next também enviar o cabeçalho, pode aparecer duplicado; é inofensivo. Para evitar, use só um dos dois lados.

Aplicar e testar:

```bash
sudo nginx -t && sudo systemctl reload nginx

curl -sI https://ebb.wiseia.com.br/login | grep -i x-robots-tag      # deve mostrar: noindex, nofollow
curl -sI https://ebb.wiseia.com.br/       | grep -i x-robots-tag      # também no 307
curl -s  https://ebb.wiseia.com.br/robots.txt                        # Fase 2: User-agent: * / Disallow: /
```

---

## B) Next.js (App Router), equivalente dentro do app

Use **uma** das duas linhas abaixo no nginx **ou** estas, para não depender só da infraestrutura. Fazer os três itens deixa o app seguro mesmo se for movido de servidor.

### 1. Cabeçalho em todas as respostas: `next.config.js` (ou `.mjs`/`.ts`)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};
module.exports = nextConfig;
```

### 2. Meta robots em todas as telas: `app/layout.tsx`

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // ... title/description já existentes ...
  robots: { index: false, follow: false },
};
```

Isso resolve o ponto encontrado: hoje só a página 404 tem a meta, a de login não.

### 3. robots.txt: `app/robots.ts` (Fase 2)

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
```

### 4. Middleware: não redirecionar `/robots.txt` para o login

No `admin.` o `/robots.txt` responde **307 → /login**, o que quebra o item 3 (o Google segue o redirecionamento e lê uma página HTML, não um robots). Em `middleware.ts`, excluir o arquivo do matcher:

```ts
export const config = {
  matcher: [
    // tudo, menos arquivos estáticos do Next e o robots.txt
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
```

(Ou, dentro da função, `if (request.nextUrl.pathname === '/robots.txt') return NextResponse.next();` antes da checagem de login.)

Depois de publicar: `curl -sI https://admin.wiseia.com.br/robots.txt` deve dar **200**, não 307.

---

## Conferência final (todos os três)

```bash
for h in ebb suleste admin; do
  echo "== $h"
  curl -sI https://$h.wiseia.com.br/login | grep -iE '^HTTP|x-robots'
  curl -s  -o /dev/null -w "robots.txt: %{http_code}\n" https://$h.wiseia.com.br/robots.txt
done
```

Esperado: `X-Robots-Tag: noindex, nofollow` e `robots.txt: 200`.
Se alguma tela já estiver indexada, usar "Remoções" no Search Console para tirar rápido, junto com o `noindex`.
