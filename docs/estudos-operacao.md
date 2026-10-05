# Area reservada de estudos

Entrada discreta em /blog: Estudos. A senha e enviada por POST, validada no servidor e abre somente o slug autorizado. O conteudo nao participa do bundle publico: permanece cifrado com AES-256-GCM, com chave exclusiva no ambiente do servidor. Cada estudo tem revisao e credencial independentes. Nao publicar senhas, chaves ou os documentos em claro no codigo publico.

As credenciais de acesso sao geradas com 18 bytes aleatorios (144 bits). Nao substituir por senhas humanas curtas. A sessao assinada dura oito horas e exige cookie HttpOnly, Secure e SameSite=Strict. Trocar a revisao revoga as sessoes daquele estudo. Respostas de conteudo e exportacao exigem a mesma autorizacao e nao sao armazenadas pelo CDN.

A defesa adicional contra tentativas e de dez por minuto por instancia. Nao e um limite global entre instancias. A validacao criptografica nao depende do banco do blog ou de objetos de armazenamento usados como contadores. Nao declarar WAF ou limitacao distribuida sem provisionamento e verificacao independentes.

O prebuild verifica configuracao, integridade dos envelopes, acesso anonimo negado, isolamento entre estudos, expiracao, CSRF, cookies, redirecionamento e encerramento de sessao. As credenciais efemeras de teste existem somente no processo do teste. O teste nao imprime senhas, documentos nem chaves.

A autorizacao controla a entrega inicial. Um destinatario autorizado pode copiar ou exportar o documento; a senha nao e DRM. Para outro estudo, cadastrar um novo envelope e uma nova entrada no registro secreto, com slug e credencial distintos.
