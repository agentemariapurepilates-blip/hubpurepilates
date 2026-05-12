import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Play, Instagram, Facebook } from 'lucide-react';
import { MONTHS } from './types';

interface PlanConfigCardProps {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  useGuide2026: boolean;
  setUseGuide2026: (v: boolean) => void;
  usePdf: boolean;
  setUsePdf: (v: boolean) => void;
  uploadedFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  instructions: string;
  setInstructions: (v: string) => void;
  generating: boolean;
  onGenerate: () => void;
  children?: React.ReactNode; // calendario fica logo abaixo, dentro do mesmo Card
}

/**
 * Card de configuracao do plano editorial (mes/ano, guia, instrucoes, botao gerar).
 * O calendario gerado fica como children dentro do mesmo Card pra manter UI atual.
 */
export function PlanConfigCard(props: PlanConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Calendário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mês / Ano */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês</Label>
            <Select value={props.selectedMonth} onValueChange={props.setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Select value={props.selectedYear} onValueChange={props.setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Guia Editorial */}
        <div className="space-y-4">
          <Label>Guia Editorial (pode marcar os dois)</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="guide2026"
                checked={props.useGuide2026}
                onCheckedChange={(checked) => props.setUseGuide2026(checked === true)}
              />
              <Label htmlFor="guide2026" className="cursor-pointer">Guia Editorial 2026</Label>
              <a
                href="/guia-editorial-2026.html"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Abrir Guia
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="guidePdf"
                checked={props.usePdf}
                onCheckedChange={(checked) => props.setUsePdf(checked === true)}
              />
              <Label htmlFor="guidePdf" className="cursor-pointer">Usar arquivo PDF</Label>
            </div>
            {props.usePdf && (
              <div className="ml-6">
                <Input
                  type="file"
                  accept=".pdf"
                  title="Upload do arquivo PDF do guia editorial"
                  onChange={props.onFileUpload}
                  className="max-w-sm"
                />
                {props.uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Arquivo selecionado: {props.uploadedFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Redes (fixo IG + FB, Facebook replica IG) */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Instagram className="h-3.5 w-3.5 text-pink-500" />
          <Facebook className="h-3.5 w-3.5 text-sky-500" />
          <span>Conteúdo gerado para <strong className="text-foreground">Instagram + Facebook</strong>. Facebook replica o Instagram automaticamente.</span>
        </div>

        {/* Instruções específicas */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Instruções Específicas</Label>
          <Textarea
            id="instructions"
            placeholder="Digite instruções específicas para aperfeiçoamento do agente (máximo 400 caracteres)"
            value={props.instructions}
            onChange={(e) => props.setInstructions(e.target.value.slice(0, 400))}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">{props.instructions.length}/400 caracteres</p>
        </div>

        {/* Botão gerar */}
        <Button onClick={props.onGenerate} disabled={!props.selectedMonth || props.generating} className="w-full">
          {props.generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Gerar grade de conteúdo
            </>
          )}
        </Button>

        {/* O calendario gerado fica como children (mantem o layout original) */}
        {props.children}
      </CardContent>
    </Card>
  );
}
