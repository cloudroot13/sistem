# Histórico de versões

## 1.10.4 — rolagem do modal de Objetivos

- Rolagem vertical por toque corrigida.
- Altura máxima baseada na área visível do dispositivo.
- Botão Criar objetivo permanece acessível no final do formulário.
- Margem segura para celulares com barra inferior.

## 1.10.3 — correção do sidebar

- Sidebar em coluna flexível sem sobreposição.
- Navegação com rolagem independente.
- Versão, atalhos e perfil fixados na área inferior.
- Ajustes para telas baixas, modo recolhido e celular.

## 1.10.2 — verificação compatível

- O verificador informa quando `products.reserved` ainda não existe.
- A auditoria continua executando mesmo antes da migração Maison v1.8.
- Mensagem orienta qual migração precisa ser aplicada.

## 1.10.1 — homologação automatizada

- Comando único `npm run verify`.
- Validação de arquivos obrigatórios e proibidos.
- Busca de dados demonstrativos no build.
- Auditoria SQL somente leitura.
- Checklist de homologação dos dois usuários.

## 1.10.0 — endurecimento de segurança

- RLS forçado nas tabelas empresariais.
- Acesso anônimo removido dos dados de negócio.
- Imagens isoladas por pasta de usuário.
- Edição e exclusão de arquivos limitadas ao proprietário.
- RPCs críticas explicitamente bloqueadas para usuários anônimos.

## 1.9.0 — estabilização

- Carregamento sob demanda dos módulos.
- Separação automática do JavaScript em vários arquivos.
- Tela de carregamento consistente.
- Proteção global contra falhas de renderização.
- Redução do carregamento inicial.

## 1.8.1 — upload de catálogo

- Upload direto de JPEG, PNG e WebP pelo cadastro do produto.
- URL pública preenchida automaticamente pelo Supabase Storage.
- Miniatura real na listagem do estoque.

## 1.8.0 — catálogo Maison G.

- Fotos de produtos no Supabase Storage.
- Coleções e variações.
- Quantidade reservada separada do estoque.
- Estrutura segura para catálogo visual.

## 1.7.0 — segurança e auditoria

- Histórico de criação, alteração e exclusão.
- Identificação do usuário responsável.
- Filtros por módulo e busca.
- RLS para isolamento dos registros por empresa.
- Recursos PWA experimentais removidos e adiados.

## 1.6.0 — aplicativo e experiência mobile

- Versão experimental retirada a pedido do usuário. O projeto permanece como
  sistema web responsivo.

## 1.5.0 — relatórios e inteligência

- Receita, despesas, lucro e ticket médio por período.
- Comparação mensal.
- Ranking de produtos e clientes.
- Lucro estimado por produto.
- Curva ABC.
- Exportação em CSV.

## 1.4.0 — planejamento financeiro

- Contas a pagar e receber.
- Vencimentos e categorias.
- Parcelamento automático.
- Estrutura para recorrência mensal e anual.
- Baixa transacional com lançamento automático no caixa.

## 1.3.0 — gestão comercial

- Edição de produtos e clientes.
- Histórico de quantidade e valor comprado por cliente.
- Detalhes e itens de cada pedido.
- Confirmação transacional de pedidos pendentes.
- Baixa de estoque e lançamento financeiro no momento do pagamento.

## 1.2.0 — carrinho e estorno seguro

- Pedidos com vários produtos.
- Edição e remoção de linhas antes da confirmação.
- Total calculado em tempo real.
- Cancelamento transacional de pedidos.
- Devolução automática das unidades ao estoque.
- Remoção da receita vinculada ao pedido cancelado.
- Proteção contra cancelamento duplicado.

## 1.1.0 — fluxo integrado de comércio

- Produtos com SKU, custo, preço, estoque e limite de estoque baixo.
- Cadastro real de clientes.
- Pedidos relacionados a clientes e produtos.
- Validação de estoque dentro de uma transação no banco.
- Baixa automática para pedidos pagos.
- Entrada automática no Financeiro.
- Dashboard da Maison G. conectado às novas tabelas.
- Documentação do fluxo e nova migração.

## 1.0.0 — base de produção

- Autenticação Supabase e isolamento por empresa.
- Módulos operacionais, Financeiro e Agenda.
- Dashboards profissionais.
- Metas e Objetivos individuais ou compartilhados.
- Notificações internas em tempo real.
