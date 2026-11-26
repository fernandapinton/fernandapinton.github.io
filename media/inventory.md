# Inventário de mídia

Auditoria inicial de 25/11/2026. Fontes em `public/media/`, preservadas localmente e ignoradas pelo Git. Referências atuais centralizadas em `media/catalog.json`; vídeos em App.tsx; a gravação de áudio foi retirada da publicação.

| Caminho local relativo a public/media | Bytes | MiB | Acima de 25 MiB | Uso |
| --- | ---: | ---: | --- | --- |
| audio/Gravação Feluma.wav | 181298520 | 172.90 | sim | original não publicado |
| images/fernanda-hero.jpg | 49380 | 0.05 | não | selecionado |
| optimized/clube-da-esquina.mp4 | 44329439 | 42.28 | sim | substituído por cópia delivery |
| optimized/gravacao-feluma.mp3 | 16445969 | 15.68 | não | retirado da publicação; somente local |
| optimized/malemolencia.mp4 | 27721834 | 26.44 | sim | substituído por cópia delivery |
| optimized/sesc.mp4 | 94156579 | 89.79 | sim | substituído por cópia delivery |
| posters/adventure-of-a-lifetime.jpg | 58489 | 0.06 | não | selecionado |
| posters/clube-da-esquina.jpg | 61555 | 0.06 | não | selecionado |
| posters/como-nossos-pais.jpg | 32140 | 0.03 | não | selecionado |
| posters/happier-than-ever.jpg | 70556 | 0.07 | não | selecionado |
| posters/mais-ninguem.jpg | 43603 | 0.04 | não | selecionado |
| posters/malandragem.jpg | 73757 | 0.07 | não | selecionado |
| posters/malemolencia.jpg | 45261 | 0.04 | não | selecionado |
| posters/misterios.jpg | 28273 | 0.03 | não | selecionado |
| posters/sesc.jpg | 44545 | 0.04 | não | selecionado |
| posters/subiru.jpg | 59127 | 0.06 | não | selecionado |
| posters/tempos-modernos.jpg | 49881 | 0.05 | não | selecionado |
| video/adventure of a lifetime medsongs.mp4 | 16612697 | 15.84 | não | selecionado |
| video/clube da esquina n 2.mp4 | 339831426 | 324.09 | sim | original não publicado |
| video/como nossos pais acolhimento calouros.mp4 | 9515257 | 9.07 | não | selecionado |
| video/happier than ever distrital.mp4 | 11408929 | 10.88 | não | selecionado |
| video/mais ninguém circuito mineiro de inovacao.mp4 | 11332868 | 10.81 | não | selecionado |
| video/malandragem major.mp4 | 11980182 | 11.43 | não | selecionado |
| video/malemolencia casamento t&a.mp4 | 180336012 | 171.98 | sim | original não publicado |
| video/misterios-coro-feminino-esmu.mp4 | 8039423 | 7.67 | não | selecionado |
| video/sesc.mp4 | 730398345 | 696.56 | sim | original não publicado |
| video/subiru sarau 2.mp4 | 10695411 | 10.20 | não | selecionado |
| video/tempos modernos semana da psicologia.mp4 | 9999380 | 9.54 | não | selecionado |

Total inicial: **28 arquivos, 1704718838 bytes (1625.75 MiB)**. Sete excediam 25 MiB, três em uso.

## Cópias novas de distribuição

| Arquivo | Bytes | MiB | Duração (s) | Dimensões | Formatos |
| --- | ---: | ---: | ---: | --- | --- |
| delivery/sesc-v1.mp4 | 24453809 | 23.32 | 291.733333 | 854 × 480 | h264 / aac |
| delivery/clube-da-esquina-v1.mp4 | 24280554 | 23.16 | 134.466667 | 1280 × 720 | h264 / aac |
| delivery/malemolencia-v1.mp4 | 24281118 | 23.16 | 83.566667 | 720 × 1280 | h264 / aac |

Distribuição final: **23 arquivos, 163216195 bytes (155.66 MiB)**. Nenhum excede 25 MiB. Não há MP3 ou WAV no pacote; a gravação permanece somente local.

## Outros recursos locais

- src/assets/fernanda-microfone.jpg: 255082 bytes; sem referências na aplicação atual, fora do bundle.
- src/assets/hero.png: 13057 bytes; sem referências na aplicação atual, fora do bundle.
- src/assets/react.svg: 4126 bytes; sem referências na aplicação atual, fora do bundle.
- src/assets/vite.svg: 8709 bytes; sem referências na aplicação atual, fora do bundle.

Os anexos de trabalho não são entradas de publicação. O build principal foi validado sem JPEG/PNG/vídeo/áudio; mantém somente HTML, JavaScript, CSS e SVG leves.
