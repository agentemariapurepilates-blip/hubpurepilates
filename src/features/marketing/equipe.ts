// Quem vê a seção Marketing do menu. Só o time de marketing: nem todo
// colaborador, nem admin automaticamente. Pessoa nova no time entra aqui,
// com o e-mail do login do Hub, em minúsculas.
//
// A Jaqueline tem dois e-mails; os dois entram, porque não se sabe com qual
// ela entra no Hub (pedido de 05/11/2026).
export const EQUIPE_MARKETING: readonly string[] = [
  'renan.vaz@purepilates.com.br', // Renan Vaz
  'renata.louzada@purepilates.com.br', // Renata Louzada
  'patricia.braga@purepilates.com.br', // Patricia Braga
  'william.costa@purepilates.com.br', // William
  'renata.flores@purepilates.com.br', // Renata Ramos Flores
  'andre.angelo@purepilates.com.br', // André
  'jaqueline.almeida@purepilates.com.br', // Jaqueline
  'jaqueline.almeida09@purepilates.com.br', // Jaqueline (segundo e-mail)
];

export const podeVerMarketing = (email: string | null | undefined): boolean =>
  !!email && EQUIPE_MARKETING.includes(email.trim().toLowerCase());
