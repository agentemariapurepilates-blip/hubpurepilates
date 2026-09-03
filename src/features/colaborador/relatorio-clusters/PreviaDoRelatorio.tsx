import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Mail, Send } from 'lucide-react';

/** O e-mail já montado: o mesmo par que a Edge Function manda para o n8n. */
export interface PreviaMontada {
  assunto: string;
  corpo: string;
}

/**
 * Os hooks entram por parâmetro, e não por import, para o componente servir os
 * dois relatórios (clusters e experimentais) e para o teste conseguir montar a
 * tela sem Supabase. Mesmo arranjo do PainelDestinatarios.
 */
export interface HooksDaPrevia {
  usarPrevia: () => {
    data?: PreviaMontada;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
  usarTeste: () => { mutate: () => void; isPending: boolean };
}

interface Props {
  hooks: HooksDaPrevia;
  /** Como o relatório é chamado no texto, ex.: "relatório de clusters". */
  nomeDoRelatorio: string;
}

function mensagemDoErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'string') return erro;
  return 'Erro desconhecido.';
}

/**
 * O e-mail exatamente como vai sair.
 *
 * Montado no navegador, com o MESMO email.ts que a Edge Function usa no envio
 * — mesma coluna do banco, mesma janela de meses, mesmo HTML. Não é uma
 * imitação, e não depende de nada publicado. Ver usePreviaDosRelatorios.
 *
 * O corpo vai num iframe de propósito. É HTML de e-mail — traz `<style>` e uma
 * árvore de `<table>` com estilo inline pensada para o Gmail. Solto na página,
 * o `<style>` dele passaria a valer para o Hub inteiro; dentro do iframe ele
 * fica preso, e a prévia mostra o e-mail no lugar de uma mistura dos dois.
 */
export function PreviaDoRelatorio({ hooks, nomeDoRelatorio }: Props) {
  const { data: previa, isLoading, isError, error } = hooks.usarPrevia();
  const { mutate: enviarTeste, isPending: enviando } = hooks.usarTeste();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Prévia do e-mail
            </CardTitle>
            <CardDescription>
              Montada com o mesmo código do envio — é isto que sai para a lista.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            // Sem prévia montada não há o que testar: o envio usaria o mesmo
            // caminho que acabou de falhar, e o segundo erro diria o mesmo.
            disabled={!previa || enviando}
            onClick={() => enviarTeste()}
          >
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar teste para mim
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Montando a prévia…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Não deu para montar {nomeDoRelatorio}.</p>
              <p className="text-muted-foreground">{mensagemDoErro(error)}</p>
              <p className="text-muted-foreground">
                A prévia é montada aqui no navegador, com os números do Painel de Indicadores.
                Uma falha nesta altura é de leitura desses números — não do envio.
              </p>
            </div>
          </div>
        )}

        {previa && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Assunto: </span>
              <span className="font-medium">{previa.assunto}</span>
            </p>

            <iframe
              title="Prévia do e-mail"
              srcDoc={previa.corpo}
              sandbox=""
              className="h-[600px] w-full rounded-lg border bg-white"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
