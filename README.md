# Portfólio da Fernanda Pinton

React + TypeScript + Vite. Aplicação no GitHub Pages e mídia estática no Cloudflare Pages Free, sem Functions, R2, Stream, domínio pago ou assinatura. Nenhum deploy, push ou alteração de conta foi realizado durante a preparação local.

## Arquitetura

O visitante abre `https://<username>.github.io/`; o navegador busca fotos, pôsteres e vídeos em `https://<media-project>.pages.dev/`. Não há redirecionamento do visitante. Os endereços dos arquivos continuam públicos e visíveis nas ferramentas do navegador; CORS não é controle de acesso.

Escolha: **um repositório, dois builds independentes**. O catálogo acompanha os componentes, evitando divergência entre repositórios e dispensando tokens de sincronização. Apenas cópias selecionadas vão ao Git. Se o catálogo crescer, separar a mídia em outro repositório evita histórico binário volumoso; o resolvedor permite essa migração sem alterar componentes.

```text
src/                        aplicação; src/media.ts resolve URLs
media/catalog.json          seleção única de fotos e apresentações
media/published/            cópias selecionadas e versionadas para distribuição
media/_headers              CORS e cache do Cloudflare
media/encoding-report.json  procedência e metadados das três cópias comprimidas
public/media/               fontes e cópias locais, ignoradas pelo Git
scripts/                    auditoria, preparação e validação
.github/workflows/pages.yml testes/build/verificação/deploy do site
dist/                      artefato GitHub, sem mídia (gerado/ignorado)
media-dist/                 artefato Cloudflare, só itens do catálogo (gerado/ignorado)
```

`public/media` e `.codex-attachments` não entram no Git nem nos artefatos. As imagens antigas de `src/assets` estão sem referências e não entram no bundle. `.gitignore` não remove arquivos já presentes no histórico; o histórico não foi reescrito. Guarde os originais também em backup externo ao checkout.

## Desenvolvimento e variáveis

Use Node 24 e `npm ci`. Em um clone novo, execute `npm run media:local` para restaurar as cópias selecionadas em `public/media` sem sobrescrever arquivos existentes. Depois execute `npm run dev`.

Copie `.env.example` para `.env.local` se precisar configurar:

| Variável | Desenvolvimento | Produção |
| --- | --- | --- |
| `VITE_MEDIA_BASE_URL` | vazia: mídia local em `/media` | obrigatória: `https://<media-project>.pages.dev` sem `/media` ao final |
| `VITE_BASE_PATH` | `/` | `/` para o site de usuário |

As variáveis Vite são públicas e incorporadas no build: nunca colocar tokens nelas. Produção rejeita URL vazia, HTTP, credenciais, query ou fragmento. Para site de projeto, use `/nome-do-repositorio/` e ajuste também o workflow; isso acrescenta esse caminho à URL principal.

Não há BrowserRouter nem rotas de páginas: `/#sobre`, `/#trabalhos`, `/#contato` usam âncoras HTML existentes. Acesso direto e atualização preservam essas URLs sem fallback de SPA ou HashRouter. A seção de áudio foi retirada por decisão da proprietária. A gravação permanece somente em `public/media`, ignorada pelo Git, sem referência no catálogo ou no site. Não foram introduzidas rotas `/sobre` ou `/trabalhos`.

## Publicação inicial gratuita

1. Escolha a conta proprietária. Para URL na raiz terminando em `.github.io`, o repositório precisa se chamar **`<username>.github.io`** (em minúsculas). O remoto atual `LuisAMSantiago/fefe-portfolio` não atende ao formato na raiz: será necessário renomeá-lo ou transferir o conteúdo ao repositório apropriado. Não houve alteração de remoto. Com GitHub Free, mantenha o repositório público e use runners padrão gratuitos.
2. Revise o catálogo e `media/published` antes do primeiro push. Eles contêm somente fotos, pôsteres e vídeos usados pelo portfólio. A gravação Feluma foi excluída da publicação e sua cópia em `media/published` foi removida; uma regra específica no `.gitignore` impede adicioná-la acidentalmente. Não inclua `.tools`, anexos ou originais.
3. Execute `npm run media:stage` e `npm run media:build`. O build falha se faltar um arquivo ou algum selecionado exceder 25 MiB; nunca pula vídeos silenciosamente. O artefato anterior é limpo antes da validação para evitar upload obsoleto. Faça commit das cópias em `media/published` junto do catálogo; os diretórios gerados `dist` e `media-dist` não vão ao Git.
4. No Cloudflare Free, crie **Pages → Connect to Git**, selecione esse repositório, produção `main`, framework `None`, raiz do projeto `/`, build **`node scripts/media.mjs build`**, output **`media-dist`**, Node **24** (`NODE_VERSION=24`). Não habilite Functions/Workers, R2, Stream ou planos pagos. Não precisa de tokens no repositório. A integração Git faz deploy automático após pushes. Pode restringir build watch paths a `media/*`, `media/**`, `scripts/media.mjs` e `scripts/media-lib.mjs`; desabilite previews se não quiser publicar branches. Não use `public` como output.
5. Aguarde o primeiro deploy de mídia. No GitHub, **Settings → Secrets and variables → Actions → Variables**, crie `VITE_MEDIA_BASE_URL` com a URL real `https://<media-project>.pages.dev`.
6. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**. Faça push para `main` ou execute manualmente **GitHub Pages**. O workflow testa, faz lint, verifica todas as URLs remotas (MIME/CORS/Range), gera `dist` e publica usando OIDC e `GITHUB_TOKEN`; não há segredo permanente. Sem mídia publicada ou variável válida, ele bloqueia a publicação.
7. Se site e mídia mudarem no mesmo push, GitHub pode começar antes de Cloudflare concluir. Depois do sucesso no Cloudflare, reexecute GitHub Pages. Isso mantém pipelines simples e evita publicar referências indisponíveis. Mudanças apenas em `media/published` não disparam o site; alterações no catálogo disparam.

Não é necessário adicionar método de pagamento. Se a plataforma solicitar upgrade ou cartão, confirme Pages Free e repositório público antes de prosseguir. O conteúdo selecionado se torna público ao fazer push ou deploy.

## Manutenção de trabalhos

- Adicione o arquivo de distribuição em `public/media/video`, `images`, `posters` ou `delivery`. Use nomes versionados para substituições (`sesc-v2.mp4`), mantendo antigos enquanto clientes usarem o catálogo anterior.
- Edite `media/catalog.json`: título, contexto, `src`, nome do pôster sem `.jpg`, proporção e `featured`. Acrescente o JPG correspondente em `posters`. O catálogo também define `hero`; componentes não contêm URLs do provedor.
- Execute `npm run media:audit`, `npm run media:stage`, `npm run media:build`, testes e build do site. `media:stage` copia somente a seleção, preservando fontes. Ao remover um trabalho, retire-o do catálogo: o build não inclui cópias antigas fora da seleção. Exclua manualmente cópias obsoletas em `media/published` quando apropriado reduzir o repositório.
- Publique primeiro mídia e depois site. O cache do navegador dura uma hora e exige revalidação após expirar; o CDN do Pages é atualizado nos deploys. Nomes novos invalidam imediatamente as referências. Não usamos `immutable` com nomes mutáveis.
- Para trocar de provedor, publique a mesma árvore, configure MIME/CORS/Range equivalentes, troque `VITE_MEDIA_BASE_URL` e refaça o build. Execute `npm run media:verify` com a URL real antes de publicar.

## Arquivos grandes e compressão autorizada

Auditoria inicial: **28 arquivos, 1.704.718.838 bytes (1.625,75 MiB)** em `public/media`. Consulte [o inventário](media/inventory.md) para tamanhos e referências individuais. Sete excediam 25 MiB, dos quais três estavam selecionados: `optimized/sesc.mp4` (89,79 MiB), `optimized/clube-da-esquina.mp4` (42,28 MiB), `optimized/malemolencia.mp4` (26,44 MiB). Os outros eram os três vídeos originais e o WAV original.

Com autorização da proprietária, foram preparadas **cópias novas** em `delivery/*-v1.mp4`, a partir dos vídeos originais; nenhum original foi substituído. H.264/yuv420p + AAC 128 kbps, 30 fps, duas passagens, `faststart`, duração completa e metadados removidos. Alvo de 23 MiB, com margem abaixo de 25 MiB. O Sesc precisa de resolução menor para caber com duração de quase cinco minutos; o relatório traz dimensões, duração e tamanho reais. A proporção dos cartões permanece igual; há perda de qualidade de compressão nas cópias.

`npm run media:compress` é ferramenta opcional, não roda em CI. Precisa de FFmpeg/FFprobe no PATH ou em `FFMPEG_PATH`/`FFPROBE_PATH`. Recusa sobrescrever os destinos existentes. Para nova versão, ajuste explicitamente os destinos no script. O catálogo só muda após as três cópias passarem na verificação. O FFmpeg portátil local fica em `.tools`, ignorado; não é dependência do site.

Alternativas futuras: comprimir outra cópia (perda de resolução/qualidade); editar trechos com autorização (altera duração/conteúdo); ou avaliar serviço gratuito como YouTube, com player, marca, termos e privacidade próprios. HLS exigiria segmentação e possivelmente outro player, portanto não foi introduzido. R2/Stream não foram habilitados: serviços com excedentes pagos não atendem à restrição solicitada.

## Performance e validação

Os vídeos mantêm identidade e chaves estáveis; não há troca de `src` durante animações. `crossOrigin="anonymous"` com CORS permite capturar o quadro pausado em canvas. Pôsteres usam lazy loading/decodificação assíncrona; a foto principal mantém prioridade alta. Vídeos ativos/vizinhos usam metadata e demais previews `none`, preservando a estratégia anterior; `preload` é sugestão e o navegador decide quanto baixar. Não há arquivo de áudio separado selecionado para publicação.

`_headers` libera leitura anônima e expõe metadados de Range; não inventa `Accept-Ranges` ou `206`. O servidor precisa atender às solicitações de bytes. As extensões `.mp4`, `.mp3` e `.jpg` permitem MIME correto; `media:verify` valida os tipos retornados e um GET parcial real para cada vídeo/áudio. `404.html` evita fallback HTML de SPA em mídia ausente. `faststart` permite ler metadados antes do restante do MP4.

```powershell
npm test
npm run lint
npm run media:build
$env:VITE_MEDIA_BASE_URL = 'https://<media-project>.pages.dev'
npm run build
npm run media:verify
```

O build principal falha se arquivos audiovisuais entrarem em `dist`. Cloudflare publica exclusivamente os itens do catálogo, `_headers` e `404.html`. Testes cobrem URLs/codificação, troca de provedor, caminhos inválidos, limite exato de tamanho/arquivos ausentes e continuidade matemática das animações existentes.

Validação inicial, anterior à retirada do áudio: 15 testes, lint, build do site (5 arquivos, 324,2 KiB, sem mídia), build de mídia (24 arquivos, 171,34 MiB), formatos e decodificação completa dos 11 MP4 e do MP3. Prévia em desktop e viewport de 390 px: reprodução, navegação, atualização em `/#trabalhos` e posição de pausa preservada ao voltar ao cartão. Duas origens locais confirmaram reprodução com CORS e captura do quadro em JPEG, sem erros no console. As 24 referências locais foram verificadas por HTTP; os 12 recursos de áudio/vídeo responderam com 206/Content-Range e CORS. Os onze vídeos iniciaram reprodução no navegador com readyState 4; o MP3 também reproduziu em uma página de verificação local, sem expor a seção oculta do portfólio. FFmpeg emitiu avisos de timestamps repetidos ao escrever a saída nula de quatro vídeos existentes (Adventure, Happier, Mais Ninguém e Malandragem); concluiu a decodificação com código zero. Esses arquivos não foram alterados. Verificar busca/sincronia nesses vídeos nos dispositivos finais.

Após deploy, confira desktop e celular: abrir diretamente `/#trabalhos`, atualizar, reproduzir, pausar, buscar no meio do vídeo, navegar/arrastar durante a pausa e voltar ao cartão; testar o som dos vídeos. Em Network, confirmar `206`, `Content-Range`, MIME, CORS, nenhum MP3 automático e ausência de novos downloads completos em cada animação. Validação local não substitui headers reais do CDN ou Safari/iOS.

## Retirada da gravação

A gravação Feluma foi retirada do catálogo, da seção oculta e da pasta de publicação. Os arquivos MP3 e WAV locais foram preservados em `public/media`, ignorados pelo Git. O componente AudioPlayer foi preservado sem uso no site e passou a receber uma URL por propriedade, sem referência à gravação.

Pacote atual: **23 arquivos, 163.216.195 bytes (155,66 MiB)**, sem MP3 ou WAV. O build principal e o de mídia foram refeitos após a remoção.

## Limites e fontes oficiais

Verificados em 25/11/2026:

- [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/): 25 MiB/arquivo, 20.000 arquivos/site, 500 builds/mês. [Requisições estáticas gratuitas e ilimitadas](https://developers.cloudflare.com/pages/functions/pricing/) não significam armazenamento irrestrito nem garantia de tráfego futuro; respeitar os [termos aplicáveis](https://www.cloudflare.com/service-specific-terms-application-services/). Este projeto serve arquivos estáticos de portfólio, sem proxy ou Functions.
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): site até 1 GB, tráfego flexível de 100 GB/mês e repositório recomendado até 1 GB. Actions personalizado dispensa 10 builds/hora, **não** o limite de tráfego. Binários fazem o histórico crescer; separar mídia passa a fazer sentido se esse crescimento for relevante.
- [Site de usuário e repositório público no Free](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [deploy Git Cloudflare](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/), [headers](https://developers.cloudflare.com/pages/configuration/headers/) e [cache/404](https://developers.cloudflare.com/pages/configuration/serving-pages/).
