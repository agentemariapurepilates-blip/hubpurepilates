import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UnitRanking } from '../types';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingTableProps {
  data: UnitRanking[];
  title: string;
  format?: 'number' | 'currency' | 'percent';
  isPercentage?: boolean;
  className?: string;
}

export function RankingTable({ data, title, format = 'number', isPercentage = false, className }: RankingTableProps) {
  const formatValue = (val: number) => {
    if (isPercentage) {
      return `${val.toFixed(1)}%`;
    }
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-950/20';
      case 2:
        return 'bg-gray-50 dark:bg-gray-950/20';
      case 3:
        return 'bg-amber-50 dark:bg-amber-950/20';
      default:
        return '';
    }
  };

  return (
    <div className={cn('metric-card p-0 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">Top 10 unidades</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16 font-semibold">#</TableHead>
            <TableHead className="font-semibold">Unidade</TableHead>
            <TableHead className="text-right font-semibold">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.unit_id} className={cn('hover:bg-muted/30', getRankBg(row.rank))}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getRankIcon(row.rank)}
                  {!getRankIcon(row.rank) && (
                    <span className="text-muted-foreground">{row.rank}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{row.unit_name}</TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {formatValue(row.value)}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                Nenhum dado disponível
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

