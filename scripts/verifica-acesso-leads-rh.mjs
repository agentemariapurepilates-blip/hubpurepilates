#!/usr/bin/env node
/**
 * Diz se o acesso a leads de RH no Meta já está liberado.
 *
 * Existe porque a falha desse acesso é SILENCIOSA: quando o app não tem
 * permissão de ler os leads de uma Página, a Graph API responde
 * `{"data":[]}` — sem erro, sem aviso. Quem olha conclui "não há leads", e o
 * problema fica meses sem ser visto. Este script compara o que o Meta CONTA
 * com o que ele ENTREGA, e nomeia a diferença.
 *
 * Uso:
 *   node scripts/verifica-acesso-leads-rh.mjs SEU_TOKEN_DE_USUARIO
 *
 * O token sai de developers.facebook.com → Graph API Explorer, com as
 * permissões `pages_show_list`, `leads_retrieval`, `ads_read` e
 * `pages_read_engagement`.
 */

const V = 'v21.0';
const EH_FORMULARIO_DE_RH = /rh|cargo|instrutor|recrut|vaga|curr/i;

const token = process.argv[2];
if (!token) {
  console.error('\n  Falta o token.\n  Uso: node scripts/verifica-acesso-leads-rh.mjs SEU_TOKEN\n');
  process.exit(1);
}

const cor = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ruim: (t) => `\x1b[31m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  fraco: (t) => `\x1b[90m${t}\x1b[0m`,
};

async function api(caminho, params = {}) {
  const q = new URLSearchParams({ ...params, access_token: token });
  const resposta = await fetch(`https://graph.facebook.com/${V}/${caminho}?${q}`);
  const corpo = await resposta.json();
  if (corpo.error) throw new Error(corpo.error.message);
  return corpo;
}

async function paginado(caminho, tokenProprio, params = {}) {
  const itens = [];
  const q = new URLSearchParams({ ...params, limit: 100, access_token: tokenProprio });
  let j = await (await fetch(`https://graph.facebook.com/${V}/${caminho}?${q}`)).json();
  if (j.error) throw new Error(j.error.message);
  itens.push(...(j.data ?? []));
  while (j.paging?.next) {
    j = await (await fetch(j.paging.next)).json();
    if (j.error) break;
    itens.push(...(j.data ?? []));
  }
  return itens;
}

const linha = () => console.log(cor.fraco('  ' + '-'.repeat(66)));

(async () => {
  console.log('');
  console.log('  VERIFICACAO DO ACESSO A LEADS DE RH');
  linha();

  // 1. Permissões do token.
  const permissoes = (await api('me/permissions')).data
    .filter((p) => p.status === 'granted')
    .map((p) => p.permission);

  const precisa = ['pages_show_list', 'leads_retrieval', 'ads_read'];
  console.log('  1. Permissoes do token');
  let faltaPermissao = false;
  for (const p of precisa) {
    const tem = permissoes.includes(p);
    if (!tem) faltaPermissao = true;
    console.log(`     ${tem ? cor.ok('ok  ') : cor.ruim('FALTA')} ${p}`);
  }

  // 2. Funções nas páginas.
  console.log('');
  // MANAGE_LEADS e a permissao que decide tudo. Ter funcao na Pagina nao
  // basta: e possivel administrar a Pagina inteira e mesmo assim receber
  // `{"data":[]}` ao pedir os leads, porque essa task especifica falta.
  console.log('  2. Suas funcoes em cada Pagina (o que importa e MANAGE_LEADS)');
  const paginas = (await api('me/accounts', { fields: 'id,name,tasks,access_token' })).data;
  for (const p of paginas) {
    const tarefas = p.tasks ?? [];
    const podeLeads = tarefas.includes('MANAGE_LEADS');
    const rotulo = podeLeads
      ? cor.ok('LEADS')
      : tarefas.length
        ? cor.aviso('sem ')
        : cor.ruim('NADA');
    const detalhe = !tarefas.length
      ? cor.ruim('sem nenhuma funcao nesta pagina')
      : podeLeads
        ? cor.fraco(tarefas.join(', '))
        : cor.aviso('tem funcao, mas SEM MANAGE_LEADS') + cor.fraco(' — ' + tarefas.join(', '));
    console.log(`     ${rotulo} ${p.id}  ${detalhe}`);
  }

  // 3. O teste que importa: contados x entregues.
  console.log('');
  console.log('  3. Formularios de RH: o que o Meta CONTA x o que ele ENTREGA');
  let totalContado = 0;
  let totalEntregue = 0;
  let algumBloqueado = false;

  for (const p of paginas) {
    if (!p.access_token) continue;
    let forms;
    try {
      forms = await paginado(`${p.id}/leadgen_forms`, p.access_token, {
        fields: 'id,name,leads_count',
      });
    } catch (e) {
      console.log(`     ${cor.ruim('ERRO')} pagina ${p.id}: ${e.message.slice(0, 70)}`);
      continue;
    }

    for (const form of forms.filter((f) => EH_FORMULARIO_DE_RH.test(f.name ?? ''))) {
      const contados = form.leads_count ?? 0;
      if (contados === 0) continue;

      let entregues = 0;
      try {
        entregues = (await paginado(`${form.id}/leads`, p.access_token, { fields: 'id' })).length;
      } catch { /* segue com zero */ }

      totalContado += contados;
      totalEntregue += entregues;

      const liberado = entregues >= contados;
      if (!liberado) algumBloqueado = true;

      console.log(
        `     ${liberado ? cor.ok('ok  ') : cor.ruim('BLOQ')} ${String(form.id).padEnd(18)} ` +
          `conta ${String(contados).padStart(4)} / entrega ${String(entregues).padStart(4)}  ` +
          cor.fraco(form.name),
      );
    }
  }

  linha();
  if (totalContado === 0) {
    console.log(cor.aviso('  Nenhum formulario de RH com lead foi encontrado.'));
    console.log(cor.fraco('  Confira se o token enxerga a Pagina que hospeda os formularios.'));
  } else if (algumBloqueado) {
    console.log(cor.ruim(`  AINDA BLOQUEADO: o Meta conta ${totalContado} leads e entrega ${totalEntregue}.`));
    console.log('');
    console.log('  Falta a permissao MANAGE_LEADS na Pagina, em business.facebook.com:');
    console.log('    Configuracoes do negocio > Contas > Paginas > (a pagina)');
    console.log('    > Pessoas > (o usuario do token) > ativar "Gerenciar leads"');
    console.log(cor.fraco('    A mesma tela lista quem ja tem: e a task MANAGE_LEADS.'));
    console.log(cor.fraco('  Depois de liberar, gere um token novo e rode este script de novo.'));
    process.exitCode = 1;
  } else {
    console.log(cor.ok(`  LIBERADO: ${totalEntregue} de ${totalContado} leads sao recuperaveis.`));
    console.log('  Proximo passo: aplicar a migration e publicar a funcao rh-leads-sync.');
  }

  if (faltaPermissao) {
    console.log('');
    console.log(cor.aviso('  Atencao: o token esta sem alguma permissao da lista acima.'));
  }
  console.log('');
})().catch((e) => {
  console.error('\n  ' + cor.ruim('FALHOU: ') + e.message + '\n');
  process.exit(1);
});
