import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createTransaction, listTransactions } from "./services/data";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FolderKanban,
  Gem,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

type Owner = "gabriel" | "giovanna";
type Period = "7 dias" | "30 dias" | "90 dias" | "Este ano";
const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const configs = {
  gabriel: {
    eyebrow: "NEXO SOFTWARE · COMMAND CENTER",
    title: "Visão executiva",
    subtitle: "Receita, projetos, clientes e operação em um só lugar.",
    accent: "#5b8cff",
    kpis: [
      {
        label: "Receita",
        values: [18240, 54420, 142800, 468200],
        change: 14.2,
        icon: CircleDollarSign,
      },
      {
        label: "Lucro líquido",
        values: [9840, 31280, 79400, 276500],
        change: 11.8,
        icon: TrendingUp,
      },
      {
        label: "Projetos ativos",
        values: [7, 12, 18, 42],
        change: 8.4,
        icon: FolderKanban,
        plain: true,
      },
      {
        label: "Conversão",
        values: [28.4, 32.8, 31.6, 34.2],
        change: 4.7,
        icon: Target,
        percent: true,
      },
    ],
    series: [18, 24, 21, 36, 42, 54],
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    operationTitle: "Pipeline de projetos",
    operation: [
      {
        name: "Nuvem Analytics",
        meta: "Entrega em 8 dias",
        value: 78,
        color: "#5b8cff",
      },
      {
        name: "Estúdio Lume",
        meta: "Em desenvolvimento",
        value: 52,
        color: "#8a6cf0",
      },
      {
        name: "Clínica Vitta",
        meta: "Aguardando aprovação",
        value: 34,
        color: "#4cb6a1",
      },
    ],
    alerts: [
      {
        title: "Entrega Nuvem Analytics",
        meta: "Prazo em 8 dias",
        tone: "warn",
      },
      {
        title: "3 leads sem follow-up",
        meta: "Há mais de 5 dias",
        tone: "danger",
      },
      { title: "Fatura de hospedagem", meta: "Vence amanhã", tone: "info" },
    ],
    tasks: [
      "Enviar proposta Studio Norte",
      "Revisar protótipo Clínica Vitta",
      "Agendar reunião de kickoff",
    ],
  },
  giovanna: {
    eyebrow: "MAISON G. · BUSINESS OVERVIEW",
    title: "Visão da boutique",
    subtitle: "Vendas, estoque, pedidos e relacionamento com clientes.",
    accent: "#c79b52",
    kpis: [
      {
        label: "Faturamento",
        values: [12480, 46280, 126400, 398600],
        change: 18.4,
        icon: CircleDollarSign,
      },
      {
        label: "Lucro líquido",
        values: [5940, 21940, 58200, 184300],
        change: 15.8,
        icon: TrendingUp,
      },
      {
        label: "Pedidos",
        values: [34, 128, 362, 1248],
        change: 12.2,
        icon: ShoppingBag,
        plain: true,
      },
      {
        label: "Ticket médio",
        values: [367, 362, 349, 319],
        change: 5.3,
        icon: Gem,
      },
    ],
    series: [12, 19, 27, 24, 38, 46],
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    operationTitle: "Desempenho das coleções",
    operation: [
      {
        name: "Coleção Aurora",
        meta: "42 peças vendidas",
        value: 86,
        color: "#c79b52",
      },
      {
        name: "Essenciais",
        meta: "31 peças vendidas",
        value: 64,
        color: "#c882a5",
      },
      {
        name: "Lumière",
        meta: "24 peças vendidas",
        value: 48,
        color: "#8e72b6",
      },
    ],
    alerts: [
      { title: "Brinco Lumière", meta: "Somente 8 unidades", tone: "warn" },
      {
        title: "Pedido #1047 pendente",
        meta: "Aguardando separação",
        tone: "danger",
      },
      {
        title: "Reposição Coleção Aurora",
        meta: "Prevista para amanhã",
        tone: "info",
      },
    ],
    tasks: [
      "Confirmar pedido com fornecedora",
      "Publicar fotos da Coleção Aurora",
      "Separar pedidos #1047 e #1049",
    ],
  },
};
function TrendChart({
  values,
  labels,
  color,
}: {
  values: number[];
  labels: string[];
  color: string;
}) {
  const max = Math.max(...values),
    points = values.map((v, i) => `${i * 20},${90 - (v / max) * 72}`).join(" ");
  return (
    <div className="proChart">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Evolução da receita"
      >
        <defs>
          <linearGradient
            id={`pro-${color.slice(1)}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor={color} stopOpacity=".35" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M0 100 L${points.replace(/ /g, " L")} L100 100 Z`}
          fill={`url(#pro-${color.slice(1)})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={i * 20}
            cy={90 - (v / max) * 72}
            r="1.7"
            fill="#15161a"
            stroke={color}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div>
        {labels.map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </div>
  );
}
export function ProfessionalDashboard({
  owner,
  onNavigate,
}: {
  owner: Owner;
  onNavigate: (page: string) => void;
}) {
  const cfg = configs[owner];
  const [period, setPeriod] = useState<Period>("30 dias"),
    [custom, setCustom] = useState(false),
    [hidden, setHidden] = useState<string[]>(() => {
      try {
        return JSON.parse(
          localStorage.getItem(`dashboard-hidden-${owner}`) || "[]",
        );
      } catch {
        return [];
      }
    }),
    [completed, setCompleted] = useState<number[]>(() => {
      try {
        return JSON.parse(
          localStorage.getItem(`dashboard-tasks-${owner}`) || "[]",
        );
      } catch {
        return [];
      }
    }),
    [refreshing, setRefreshing] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [financeItems, setFinanceItems] = useState<any[]>([]);
  useEffect(()=>{listTransactions(owner).then(setFinanceItems).catch(()=>{})},[owner]);
  const [expenseDraft, setExpenseDraft] = useState({
    description: "",
    category: "Operacional",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    status: "Pago" as "Pago" | "Pendente",
  });
  const expenses = financeItems.filter((item: any) => item.type === "Saída");
  const paidExpenses = expenses
    .filter((item: any) => item.status === "Pago")
    .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  const pendingExpenses = expenses
    .filter((item: any) => item.status === "Pendente")
    .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  const receivedIncome = financeItems.filter((item:any)=>item.type==="Entrada"&&item.status==="Pago").reduce((sum:number,item:any)=>sum+Number(item.amount),0);
  const actualProfit = receivedIncome-paidExpenses;
  const addExpense = async () => {
    const amount = Number(expenseDraft.amount.replace(",", "."));
    if (!expenseDraft.description.trim() || !amount) return;
    try{const created=await createTransaction(owner,{...expenseDraft,amount,type:"Saída"});setFinanceItems([created,...financeItems]);setExpenseDraft({...expenseDraft,description:"",amount:""});setExpenseOpen(false)}catch{return}
  };
  const periodIndex = (
    ["7 dias", "30 dias", "90 dias", "Este ano"] as Period[]
  ).indexOf(period);
  const revenue = financeItems.length ? receivedIncome : cfg.kpis[0].values[periodIndex];
  const toggleWidget = (x: string) => {
    const next = hidden.includes(x)
      ? hidden.filter((y) => y !== x)
      : [...hidden, x];
    setHidden(next);
    localStorage.setItem(`dashboard-hidden-${owner}`, JSON.stringify(next));
  };
  const toggleTask = (i: number) => {
    const next = completed.includes(i)
      ? completed.filter((x) => x !== i)
      : [...completed, i];
    setCompleted(next);
    localStorage.setItem(`dashboard-tasks-${owner}`, JSON.stringify(next));
  };
  const exportData = () => {
    const rows = [
      "Indicador,Valor,Variação",
      ...cfg.kpis.map(
        (k) => `${k.label},${k.values[periodIndex]},${k.change}%`,
      ),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv" }),
    );
    a.download = `dashboard-${owner}.csv`;
    a.click();
  };
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };
  return (
    <div className={`professionalDashboard dashboard-${owner}`}>
      <div className="dashboardTop">
        <div>
          <span className="eyebrow">{cfg.eyebrow}</span>
          <h1>{cfg.title}</h1>
          <p>{cfg.subtitle}</p>
        </div>
        <div className="dashboardActions">
          <button aria-label="Atualizar dados" onClick={refresh}>
            <RefreshCw className={refreshing ? "spin" : ""} />
          </button>
          <button onClick={exportData}>
            <Download />
            <span>Exportar</span>
          </button>
          <button onClick={() => setCustom(true)}>
            <Settings2 />
            <span>Personalizar</span>
          </button>
          <button
            className="expenseButton"
            onClick={() => setExpenseOpen(true)}
          >
            <ArrowDownRight />
            <span>Nova despesa</span>
          </button>
          <button
            className="quick"
            onClick={() =>
              onNavigate(owner === "gabriel" ? "Projetos" : "Pedidos")
            }
          >
            <Plus />
            <span>{owner === "gabriel" ? "Novo projeto" : "Novo pedido"}</span>
          </button>
        </div>
      </div>
      <div className="dashboardFilters">
        <div className="periods" aria-label="Período do dashboard">
          {(["7 dias", "30 dias", "90 dias", "Este ano"] as Period[]).map(
            (x) => (
              <button
                aria-pressed={period === x}
                className={period === x ? "active" : ""}
                onClick={() => setPeriod(x)}
                key={x}
              >
                {x}
              </button>
            ),
          )}
        </div>
        <span>
          <span className="liveDot" /> Dados atualizados agora
        </span>
      </div>
      <section className="expenseOverview" aria-label="Resumo de despesas">
        <div>
          <i>
            <ArrowDownRight />
          </i>
          <span>
            <small>Despesas pagas</small>
            <b>{brl(paidExpenses)}</b>
          </span>
        </div>
        <div>
          <span>
            <small>Despesas pendentes</small>
            <b>{brl(pendingExpenses)}</b>
          </span>
        </div>
        <div className="recentExpense">
          <span>
            <small>Última despesa</small>
            <b>{expenses[0]?.description || "Nenhuma despesa"}</b>
          </span>
          <strong>{expenses[0] ? brl(expenses[0].amount) : "—"}</strong>
        </div>
        <button onClick={() => onNavigate("Financeiro")}>
          Ver todas <ChevronRight />
        </button>
      </section>
      {!hidden.includes("kpis") && (
        <section className="proKpis" aria-label="Indicadores principais">
          {cfg.kpis.map((k, i) => {
            const Icon = k.icon,
              val = financeItems.length && i===0 ? receivedIncome : financeItems.length && i===1 ? actualProfit : k.values[periodIndex];
            return (
              <motion.article
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={k.label}
              >
                <div>
                  <span>{k.label}</span>
                  <i>
                    <Icon />
                  </i>
                </div>
                <strong>
                  {k.plain
                    ? val
                    : "percent" in k && k.percent
                      ? `${val}%`
                      : brl(val)}
                </strong>
                <small className="up">
                  <ArrowUpRight />
                  {k.change}% <span>vs. período anterior</span>
                </small>
                <div className="miniBars">
                  {cfg.series.slice(-5).map((x, n) => (
                    <i
                      key={n}
                      style={{ height: `${20 + x}%`, opacity: 0.35 + n * 0.13 }}
                    />
                  ))}
                </div>
              </motion.article>
            );
          })}
        </section>
      )}
      <div className="dashboardMain">
        {!hidden.includes("revenue") && (
          <section className="proCard revenuePanel">
            <div className="proCardHead">
              <div>
                <h2>Receita e crescimento</h2>
                <p>Performance financeira consolidada</p>
              </div>
              <button onClick={() => onNavigate("Financeiro")}>
                Ver financeiro <ChevronRight />
              </button>
            </div>
            <div className="revenueTotal">
              <strong>{brl(revenue)}</strong>
              <span>
                <ArrowUpRight /> {cfg.kpis[0].change}%
              </span>
            </div>
            <TrendChart
              values={cfg.series}
              labels={cfg.labels}
              color={cfg.accent}
            />
            <div className="chartLegend">
              <span>
                <i />
                Receita realizada
              </span>
              <b>Meta: {brl(revenue * 1.2)}</b>
            </div>
          </section>
        )}
        {!hidden.includes("operation") && (
          <section className="proCard operationPanel">
            <div className="proCardHead">
              <div>
                <h2>{cfg.operationTitle}</h2>
                <p>Visão de performance atual</p>
              </div>
              <button
                onClick={() =>
                  onNavigate(owner === "gabriel" ? "Projetos" : "Estoque")
                }
              >
                Ver tudo <ChevronRight />
              </button>
            </div>
            {cfg.operation.map((x) => (
              <div className="operationRow" key={x.name}>
                <div>
                  <b>{x.name}</b>
                  <small>{x.meta}</small>
                </div>
                <strong>{x.value}%</strong>
                <span>
                  <i style={{ width: `${x.value}%`, background: x.color }} />
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="dashboardLower">
        {!hidden.includes("alerts") && (
          <section className="proCard alertPanel">
            <div className="proCardHead">
              <div>
                <h2>Alertas e atenção</h2>
                <p>Itens que precisam de você</p>
              </div>
              <span className="countBadge">{cfg.alerts.length}</span>
            </div>
            {cfg.alerts.map((x, i) => (
              <button
                onClick={() =>
                  onNavigate(
                    i === 2
                      ? "Financeiro"
                      : owner === "gabriel"
                        ? "Projetos"
                        : "Pedidos",
                  )
                }
                key={x.title}
              >
                <i className={x.tone}>
                  {x.tone === "danger" ? (
                    <AlertTriangle />
                  ) : x.tone === "warn" ? (
                    <Clock3 />
                  ) : (
                    <Zap />
                  )}
                </i>
                <span>
                  <b>{x.title}</b>
                  <small>{x.meta}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
          </section>
        )}
        {!hidden.includes("tasks") && (
          <section className="proCard taskPanel">
            <div className="proCardHead">
              <div>
                <h2>Tarefas prioritárias</h2>
                <p>
                  {completed.length} de {cfg.tasks.length} concluídas
                </p>
              </div>
              <button onClick={() => onNavigate("Agenda")}>
                Agenda <ChevronRight />
              </button>
            </div>
            {cfg.tasks.map((x, i) => (
              <label className={completed.includes(i) ? "checked" : ""} key={x}>
                <input
                  type="checkbox"
                  checked={completed.includes(i)}
                  onChange={() => toggleTask(i)}
                />
                <i>
                  <CheckCircle2 />
                </i>
                <span>{x}</span>
                <small>Hoje</small>
              </label>
            ))}
            <div className="taskProgress">
              <span>
                <i
                  style={{
                    width: `${(completed.length / cfg.tasks.length) * 100}%`,
                  }}
                />
              </span>
              <b>{Math.round((completed.length / cfg.tasks.length) * 100)}%</b>
            </div>
          </section>
        )}
        {!hidden.includes("goal") && (
          <section className="proCard goalPanel">
            <div className="goalIcon">
              <Target />
            </div>
            <span className="eyebrow">META EM CONJUNTO</span>
            <h2>Viagem para Itália</h2>
            <p>Vocês estão quase na metade do caminho.</p>
            <div className="goalNumbers">
              <b>R$ 14.800</b>
              <span>de R$ 30.000</span>
            </div>
            <div className="goalLine">
              <i />
            </div>
            <div className="goalFoot">
              <strong>49% concluído</strong>
              <button onClick={() => onNavigate("Metas")}>
                Ver meta <ChevronRight />
              </button>
            </div>
          </section>
        )}
      </div>
      <section className="dashboardFoot">
        <span>
          <CheckCircle2 />
          Todos os sistemas operacionais
        </span>
        <span>Última sincronização: agora</span>
        <button onClick={refresh}>Sincronizar dados</button>
      </section>
      <AnimatePresence>
        {expenseOpen && (
          <div className="modalBg" onClick={() => setExpenseOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="expense-title"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Fechar"
                onClick={() => setExpenseOpen(false)}
              >
                <X />
              </button>
              <span className="eyebrow">NOVA DESPESA</span>
              <h2 id="expense-title">Adicionar despesa</h2>
              <label>
                Descrição
                <input
                  autoFocus
                  value={expenseDraft.description}
                  onChange={(e) =>
                    setExpenseDraft({
                      ...expenseDraft,
                      description: e.target.value,
                    })
                  }
                  placeholder={
                    owner === "gabriel"
                      ? "Ex: Assinatura de software"
                      : "Ex: Compra de embalagens"
                  }
                />
              </label>
              <div className="formRow">
                <label>
                  Categoria
                  <select
                    value={expenseDraft.category}
                    onChange={(e) =>
                      setExpenseDraft({
                        ...expenseDraft,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Operacional</option>
                    <option>Estoque</option>
                    <option>Marketing</option>
                    <option>Impostos</option>
                    <option>Fornecedores</option>
                    <option>Outros</option>
                  </select>
                </label>
                <label>
                  Valor
                  <input
                    inputMode="decimal"
                    value={expenseDraft.amount}
                    onChange={(e) =>
                      setExpenseDraft({
                        ...expenseDraft,
                        amount: e.target.value,
                      })
                    }
                    placeholder="0,00"
                  />
                </label>
              </div>
              <div className="formRow">
                <label>
                  Data
                  <input
                    type="date"
                    value={expenseDraft.date}
                    onChange={(e) =>
                      setExpenseDraft({ ...expenseDraft, date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    value={expenseDraft.status}
                    onChange={(e) =>
                      setExpenseDraft({
                        ...expenseDraft,
                        status: e.target.value as "Pago" | "Pendente",
                      })
                    }
                  >
                    <option>Pago</option>
                    <option>Pendente</option>
                  </select>
                </label>
              </div>
              <button className="primary full" onClick={addExpense}>
                Salvar despesa
              </button>
            </motion.div>
          </div>
        )}
        {custom && (
          <div className="modalBg" onClick={() => setCustom(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="custom-title"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal customModal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Fechar"
                onClick={() => setCustom(false)}
              >
                <X />
              </button>
              <span className="eyebrow">PERSONALIZAÇÃO</span>
              <h2 id="custom-title">Organizar dashboard</h2>
              <p>Escolha quais blocos deseja visualizar.</p>
              {[
                ["kpis", "Indicadores principais"],
                ["revenue", "Receita e crescimento"],
                ["operation", cfg.operationTitle],
                ["alerts", "Alertas"],
                ["tasks", "Tarefas prioritárias"],
                ["goal", "Meta em conjunto"],
              ].map(([id, label]) => (
                <button
                  className="widgetToggle"
                  onClick={() => toggleWidget(id)}
                  key={id}
                >
                  {hidden.includes(id) ? <EyeOff /> : <Eye />}
                  <span>{label}</span>
                  <i>{hidden.includes(id) ? "Oculto" : "Visível"}</i>
                </button>
              ))}
              <button className="primary full" onClick={() => setCustom(false)}>
                Concluir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
