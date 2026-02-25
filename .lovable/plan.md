

# Expandir conteudo completo da Timeline Marco 2026

## Problema

O conteudo escrito da landing page esta resumido em praticamente todas as secoes. Textos longos do PDF foram condensados em 1-2 frases. Vou expandir para incluir todo o conteudo original.

## Secoes que precisam ser expandidas

### 1. Hero / Introducao
**Atual**: 1 frase generica
**PDF completo**: "Caros franqueados, O primeiro bimestre de 2026 trouxe grandes entregas para a rede. Com isso, temos um resumo da saude de marca e das campanhas de midia paga. Confira um resumo do que realizamos e ja pode comecar programar as redes sociais locais e as negociacoes de leads nao convertidos ja que preparamos reforcos para o mes de marco."

### 2. Brandformance
**Atual**: 2 frases sobre DT
**PDF completo**: Paragrafo inteiro sobre performance via midia paga, novos parametros de metas, produtividade das agencias

### 3. Janeiro - Texto explicativo
**Atual**: Apenas os 3 cards com numeros
**Falta**: Texto sobre "ano novo, vida nova", reforco de YouTube Ads, gap de 251 matriculas, comportamento de conversao com decisao de compra superior a 5 dias

### 4. Fevereiro - Texto explicativo
**Atual**: Apenas os 3 cards com numeros
**Falta**: Texto sobre impacto do carnaval, verba de +24% para topo de funil, estrategia de final de funil para unidades criticas, margem recuperavel nos ultimos dias

### 5. Acumulado - Texto explicativo
**Atual**: Apenas numeros
**Falta**: Analise sobre consistencia do topo e meio de funil, recuperacao de fevereiro frente a janeiro

### 6. Evolucao da Conversao
**Atual**: Resumido
**Falta**: Texto sobre cupons promocionais, novos mecanismos e treinamentos, convocacao em breve. Tambem falta o paragrafo sobre saude de marca nas redes sociais

### 7. YouTube / Share de Midia
**Atual**: Resumido
**Falta**: Texto completo sobre "A melhor hora do dia", recorde de busca, pesquisas de impacto, elasticidade, composto de midia com (1) alta performance e (2) videos de diferenciais. Texto sobre desconto de 15% de impostos e politicas para novas unidades

### 8. Buzz Monitor Janeiro
**Atual**: 2 frases
**Falta**: Bullets detalhados sobre experiencia acolhedora, postura, forca, bem-estar, comunidade, desafios semanais. Conversas sobre precos, Gympass, audiencia investigativa

### 9. Buzz Monitor Fevereiro
**Atual**: 2 frases
**Falta**: Detalhes sobre valores, planos, condicoes de pagamento, localizacao, Gympass, TotalPass. Mencoes positivas sobre beneficios fisicos e emocionais. Texto sobre desafios semanais como engajamento, mencoes negativas sobre clareza e tempo de resposta. Cenario da comunidade ativa

### 10. Vem Ai Marco - Descricoes expandidas
**Atual**: Cada card tem 1 frase
**Falta**: Textos completos de cada item:
- 50% OFF: detalhe sobre leads de fevereiro nao estarem na base como medida protetiva
- Cupom PURE10: detalhe sobre aplicacao conforme negociacao
- Midia: detalhe sobre categorias de final de funil e awareness
- TikTok: mencionar calendario de redes sociais, nova configuracao
- Reclame Aqui: mencionar nova sessao de treinamentos do Pure System
- Pure Match: texto completo sobre conectar franqueados a instrutores

### 11. POST ESPECIAL: Reclame Aqui (secao nova)
**Completamente ausente**: Paginas 7-8 do PDF com secao dedicada explicando Company Page, por que importa (13 mil consultas), videos explicativos, FAQ, links diretos, o que agrega de verdade

### 12. POST ESPECIAL: TikTok (secao nova)
**Completamente ausente**: Paginas 8-9 do PDF com perfil oficial @purepilatesbr, dados (2053 seguidores, 11.8K curtidas), alinhamento sobre perfil unico centralizado, nenhuma unidade deve criar TikTok proprio, conteudo especifico da plataforma

### 13. Desafio Franchising - Expandido
**Atual**: Resumido
**Falta**: Como vai funcionar (post oficial no comeco do mes, stories de lembrete semanal), calendario de publicacoes terca e quinta, depoimentos (procurar o William para gravar)

## Mudancas tecnicas

### Arquivo modificado
`src/components/timeline/MonthLanding_2026_03.tsx`

### O que muda
- Adicionar paragrafos de texto abaixo de cada secao de metricas (Janeiro, Fevereiro, Acumulado)
- Expandir todos os textos resumidos com o conteudo completo do PDF
- Criar 2 secoes novas: "Post Especial: Reclame Aqui" e "Post Especial: TikTok" com cards dedicados e conteudo completo
- Expandir secao do Desafio Franchising com subsecoes (como funciona, calendario, depoimentos)
- Expandir descricoes dos cards "Vem Ai Marco"

### Estrutura visual das novas secoes
- Reclame Aqui: Card com icone, titulo, e subsecoes (Por que importa, O que vai ter, O que agrega)
- TikTok: Card com dados do perfil (@purepilatesbr), aviso sobre perfil unico, conteudo planejado
- Ambos com animacoes scroll-reveal consistentes com o restante da pagina

