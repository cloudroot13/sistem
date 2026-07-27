# Nexo ERP — v1.10.4

ERP responsivo para dois ambientes de negócio, desenvolvido com React,
TypeScript, Vite, Tailwind CSS e Supabase.

## Recursos

- Autenticação segura pelo Supabase Auth.
- Ambientes separados por empresa e protegidos por RLS.
- Dashboard com dados financeiros e operacionais reais.
- CRM, projetos, estoque, clientes, fornecedores e pedidos.
- Financeiro com entradas, despesas, filtros e exportação CSV.
- Agenda privada ou compartilhada.
- Metas em conjunto.
- Objetivos individuais ou compartilhados.
- Calendário mensal e desafios personalizados de até 366 dias.
- Progresso diário separado por participante.
- Notificações em tempo real quando outra pessoa conclui um dia.
- Layout responsivo e recursos básicos de acessibilidade.

## Requisitos

- Node.js 20 ou superior.
- Projeto no Supabase.
- Projeto na Vercel para publicação.

## Instalação local

```bash
npm install
```

Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Nunca coloque `service_role` ou senhas nesse arquivo.

Inicie o ambiente:

```bash
npm run dev
```

Valide antes de publicar:

```bash
npm run typecheck
npm run build
npm run verify
```

## Configuração do Supabase

Para uma instalação nova, abra **SQL Editor** e execute:

1. `supabase/schema.sql`
2. `supabase/link-users.sql`, depois de ajustar os e-mails.
3. `supabase/commerce-v1.1-migration.sql`
4. `supabase/commerce-v1.2-migration.sql`
5. `supabase/commerce-v1.3-migration.sql`
6. `supabase/finance-v1.4-migration.sql`
7. `supabase/audit-v1.7-migration.sql`
8. `supabase/maison-v1.8-migration.sql`
9. `supabase/security-v1.10-migration.sql`

Se o banco já estava instalado antes da área de Objetivos, execute nesta ordem:

1. `supabase/objectives-migration.sql`
2. `supabase/collaborative-objectives-migration.sql`
3. `supabase/commerce-v1.1-migration.sql`
4. `supabase/commerce-v1.2-migration.sql`
5. `supabase/commerce-v1.3-migration.sql`
6. `supabase/finance-v1.4-migration.sql`
7. `supabase/audit-v1.7-migration.sql`
8. `supabase/maison-v1.8-migration.sql`
9. `supabase/security-v1.10-migration.sql`

A última migração:

- adiciona objetivos individuais e em conjunto;
- permite progresso independente para cada usuário;
- cria notificações de conclusão;
- habilita atualizações em tempo real;
- corrige as políticas RLS;
- remove a antiga tabela insegura de tentativas de login.

## Usuários e perfis

Crie cada usuário em **Authentication > Users**. Depois ajuste os e-mails em
`supabase/link-users.sql` e execute o arquivo.

Cada usuário precisa ter:

- uma linha em `profiles`, com `display_name`;
- uma associação em `company_members`.

Os nomes exibidos no progresso conjunto vêm de `profiles.display_name`.

## Objetivos em conjunto

Ao criar um objetivo:

1. Escolha **Individual** ou **Em conjunto**.
2. Escolha calendário mensal ou desafio personalizado.
3. Cadastre as atividades diárias.
4. Cada pessoa marca apenas o próprio progresso.

Em objetivos conjuntos, o painel mostra o percentual de cada participante.
Quando alguém completa todas as atividades de um dia, os outros usuários
recebem uma notificação no sino do cabeçalho. Clicar nela abre Objetivos.

## Fluxo integrado de pedidos

Na v1.2.0, os módulos Estoque, Clientes e Pedidos da Maison G. utilizam tabelas
relacionais próprias. Ao registrar um pedido pago, uma única operação no banco:

1. cria o pedido e seus itens;
2. valida a quantidade disponível;
3. baixa o estoque;
4. calcula o total usando o preço atual do produto;
5. cria a entrada correspondente no Financeiro.

Se alguma etapa falhar, toda a operação é cancelada, evitando dados parciais.
Pedidos pendentes não baixam estoque nem geram receita.

Um pedido pode conter vários produtos. O cancelamento de um pedido pago devolve
as quantidades ao estoque e remove somente o lançamento financeiro ligado àquele
pedido. Pedidos já cancelados não são processados novamente.

## Publicação na Vercel

Em **Settings > Environment Variables**, adicione:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Marque Production, Preview e Development. Depois faça um novo deploy.

Configuração esperada:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Segurança

- Senhas são tratadas exclusivamente pelo Supabase Auth.
- O sistema não armazena nem registra senhas digitadas.
- A chave publicável pode ser usada no navegador porque o acesso é protegido
  pelas políticas RLS.
- Nunca exponha a chave `service_role`.
- Objetivos individuais são visíveis somente ao criador.
- Cada usuário só pode excluir as próprias conclusões.

## Solução de problemas

### Objetivos não carregam

Execute as duas migrações de Objetivos no SQL Editor e confirme que não houve
erro.

### Notificações não chegam

- Confirme que o objetivo está como **Em conjunto**.
- Confirme que ambos possuem linha em `profiles`.
- Confirme que `notifications` está em Database > Replication.
- Recarregue uma vez após aplicar a migração.

### Conta sem acesso

Confira a associação do usuário em `company_members`.

### Build falha na Vercel

Confirme as duas variáveis `VITE_` e use Node.js 20 ou superior.

## Estrutura principal

- `src.tsx`: aplicação, navegação, autenticação e módulos operacionais.
- `dashboard.tsx`: dashboards profissionais.
- `advanced.tsx`: Financeiro e Agenda.
- `objectives.tsx`: acompanhamento de objetivos.
- `notifications.tsx`: central de notificações.
- `services/data.ts`: acesso aos dados do Supabase.
- `supabase/`: schema e migrações.

## Versões

A versão atual também está registrada no arquivo `VERSION` e no `package.json`.
Consulte `CHANGELOG.md` para conhecer cada entrega.
