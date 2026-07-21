import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Wallet,
  CalendarDays,
  Target,
  Bell,
  Search,
  PanelLeftClose,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Package,
  ShoppingBag,
  Truck,
  Menu,
  X,
  Command,
  ArrowUpRight,
  Gem,
  Code2,
} from "lucide-react";
import "./tailwind.css";
import { AgendaPage, FinancePage } from "./advanced";
import { ProfessionalDashboard } from "./dashboard";

const blue = "#5b8cff",
  gold = "#c79b52";
const devData = [
  { m: "Jan", v: 18 },
  { m: "Fev", v: 24 },
  { m: "Mar", v: 21 },
  { m: "Abr", v: 36 },
  { m: "Mai", v: 42 },
  { m: "Jun", v: 54 },
];
const jewelData = [
  { m: "Jan", v: 12 },
  { m: "Fev", v: 19 },
  { m: "Mar", v: 27 },
  { m: "Abr", v: 24 },
  { m: "Mai", v: 38 },
  { m: "Jun", v: 46 },
];
const menuGabriel = [
  [LayoutDashboard, "Visão geral"],
  [Users, "CRM"],
  [FolderKanban, "Projetos"],
  [Wallet, "Financeiro"],
  [CalendarDays, "Agenda"],
];
const menuGiovanna = [
  [LayoutDashboard, "Visão geral"],
  [Package, "Estoque"],
  [Users, "Clientes"],
  [Truck, "Fornecedores"],
  [ShoppingBag, "Pedidos"],
  [Wallet, "Financeiro"],
];
const goals = [
  {
    title: "Faturar R$ 100.000",
    cat: "Financeiro",
    now: 67500,
    total: 100000,
    p: 68,
    owner: "G",
    date: "28 Dez",
  },
  {
    title: "Viagem para Itália",
    cat: "Viagem",
    now: 14800,
    total: 30000,
    p: 49,
    owner: "J",
    date: "15 Nov",
  },
  {
    title: "Comprar apartamento",
    cat: "Patrimônio",
    now: 84000,
    total: 280000,
    p: 30,
    owner: "GJ",
    date: "Jun 2027",
  },
];
const events = [
  ["10:00", "Reunião • Projeto Nuvem", "blue"],
  ["14:30", "Fotos da coleção Aurora", "gold"],
  ["17:00", "Pagamento hospedagem", "violet"],
];
function money(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
function Login({ go }: { go: (x: "gabriel" | "giovanna") => void }) {
  return (
    <div className="login">
      <div className="loginGlow" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="loginCard"
      >
        <div className="brandMark">N</div>
        <h1>Bem-vindo ao Nexo</h1>
        <p>Seu grupo, suas empresas. Uma visão completa.</p>
        <div className="profiles">
          <button onClick={() => go("gabriel")}>
            <span className="avatar gab">
              <Code2 />
            </span>
            <span>
              <b>Gabriel</b>
              <small>Nexo Software</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => go("giovanna")}>
            <span className="avatar gio">
              <Gem />
            </span>
            <span>
              <b>Giovanna</b>
              <small>Maison G. Joias</small>
            </span>
            <ChevronRight />
          </button>
        </div>
        <div className="secure">● Ambiente seguro e privado</div>
      </motion.div>
      <div className="loginFoot">
        NEXO GROUP <span>© 2026</span>
      </div>
    </div>
  );
}
function Stat({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: any;
}) {
  return (
    <motion.div whileHover={{ y: -3 }} className="stat">
      <div className="statTop">
        <span>{label}</span>
        <i>
          <Icon />
        </i>
      </div>
      <strong>{value}</strong>
      <small>
        <b>↗ {delta}</b> vs. mês anterior
      </small>
    </motion.div>
  );
}
function Chart({ jewel = false }: { jewel?: boolean }) {
  let c = jewel ? gold : blue,
    d = jewel ? jewelData : devData;
  const max = Math.max(...d.map((item) => item.v));
  const points = d.map((item, index) => `${index * 20},${92 - (item.v / max) * 76}`).join(" ");
  return (
    <div className="card chart">
      <div className="cardHead">
        <div>
          <h3>Performance financeira</h3>
          <p>Receita dos últimos 6 meses</p>
        </div>
        <button>Últimos 6 meses⌄</button>
      </div>
      <div className="chartValue">
        <b>{jewel ? "R$ 46.280" : "R$ 54.420"}</b>
        <span>+18,4%</span>
      </div>
      <div className="lightChart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-labelledby="chart-title chart-description">
          <title id="chart-title">Receita dos últimos seis meses</title>
          <desc id="chart-description">Crescimento de {d[0].v} mil para {d[d.length - 1].v} mil reais.</desc>
          <defs><linearGradient id={`fill-${jewel}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity=".35"/><stop offset="1" stopColor={c} stopOpacity="0"/></linearGradient></defs>
          <polygon points={`0,100 ${points} 100,100`} fill={`url(#fill-${jewel})`}/>
          <polyline points={points} fill="none" stroke={c} strokeWidth="1.8" vectorEffect="non-scaling-stroke"/>
        </svg>
        <div className="chartLabels">{d.map(item => <span key={item.m}>{item.m}</span>)}</div>
      </div>
    </div>
  );
}
function Goals() {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">ESPAÇO COMPARTILHADO</span>
          <h1>Metas em conjunto</h1>
          <p>Construam os próximos capítulos, juntos.</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <Plus />
          Nova meta
        </button>
      </div>
      <div className="goalHero">
        <div>
          <Target />
          <span>
            <b>R$ 166.300</b>
            <small>guardados em conjunto</small>
          </span>
        </div>
        <div>
          <b>3</b>
          <small>metas ativas</small>
        </div>
        <div>
          <b>49%</b>
          <small>progresso médio</small>
        </div>
      </div>
      <div className="goalGrid">
        {goals.map((g, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="goal"
            key={g.title}
          >
            <div className="goalTop">
              <span className="tag">{g.cat}</span>
              <span className="owners">{g.owner}</span>
            </div>
            <h3>{g.title}</h3>
            <div className="numbers">
              <b>{money(g.now)}</b>
              <span>de {money(g.total)}</span>
            </div>
            <div className="progress">
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: g.p + "%" }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="goalBottom">
              <b>{g.p}% concluído</b>
              <span>
                <CalendarDays /> {g.date}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="card activity">
        <div className="cardHead">
          <div>
            <h3>Atividade recente</h3>
            <p>Atualizações das metas compartilhadas</p>
          </div>
        </div>
        <p>
          <span className="avatarMini gio">G</span>
          <b>Giovanna</b> adicionou R$ 1.200 em “Viagem para Itália”{" "}
          <small>há 2 horas</small>
        </p>
        <p>
          <span className="avatarMini gab">G</span>
          <b>Gabriel</b> comentou em “Comprar apartamento” <small>ontem</small>
        </p>
      </div>
      <AnimatePresence>
        {show && (
          <div className="modalBg" onClick={() => setShow(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close" onClick={() => setShow(false)}>
                <X />
              </button>
              <span className="eyebrow">NOVA CONQUISTA</span>
              <h2>Criar meta em conjunto</h2>
              <label>
                Título
                <input placeholder="Ex: Comprar nosso apartamento" autoFocus />
              </label>
              <div className="formRow">
                <label>
                  Valor alvo
                  <input placeholder="R$ 0,00" />
                </label>
                <label>
                  Data final
                  <input type="date" />
                </label>
              </div>
              <label>
                Descrição
                <textarea placeholder="Por que essa meta é importante?" />
              </label>
              <button className="primary full" onClick={() => setShow(false)}>
                Criar meta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
function Calendar() {
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">AGENDA DO GRUPO</span>
          <h1>Calendário compartilhado</h1>
          <p>Compromissos pessoais e das duas empresas.</p>
        </div>
        <button className="primary">
          <Plus />
          Novo evento
        </button>
      </div>
      <div className="calendar card">
        <div className="calTop">
          <h3>
            Julho <span>2026</span>
          </h3>
          <div>
            <button>Hoje</button>
            <button>‹</button>
            <button>›</button>
          </div>
        </div>
        <div className="week">
          {[
            "SEG 20",
            "TER 21",
            "QUA 22",
            "QUI 23",
            "SEX 24",
            "SÁB 25",
            "DOM 26",
          ].map((x, i) => (
            <div className={i == 2 ? "today" : ""} key={x}>
              <span>{x.split(" ")[0]}</span>
              <b>{x.split(" ")[1]}</b>
              {i === 0 && <i className="ev blue">10:00 Reunião Nuvem</i>}
              {i === 2 && (
                <>
                  <i className="ev gold">14:30 Coleção Aurora</i>
                  <i className="ev violet">17:00 Pagamento</i>
                </>
              )}
              {i === 4 && <i className="ev blue">09:00 Entrega e-commerce</i>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
function Overview({ jewel }: { jewel: boolean }) {
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">SEGUNDA, 20 DE JULHO</span>
          <h1>
            Olá, {jewel ? "Giovanna" : "Gabriel"} <span>👋</span>
          </h1>
          <p>
            {jewel
              ? "Sua loja vendeu 18% a mais este mês."
              : "Aqui está o pulso da sua empresa hoje."}
          </p>
        </div>
        <button className="primary">
          <Plus />
          {jewel ? "Novo pedido" : "Novo projeto"}
        </button>
      </div>
      <div className="stats">
        {jewel ? (
          <>
            <Stat
              label="Faturamento"
              value="R$ 46.280"
              delta="18,4%"
              icon={Wallet}
            />
            <Stat
              label="Pedidos"
              value="128"
              delta="12,2%"
              icon={ShoppingBag}
            />
            <Stat
              label="Itens em estoque"
              value="842"
              delta="4,1%"
              icon={Package}
            />
            <Stat
              label="Lucro líquido"
              value="R$ 21.940"
              delta="15,8%"
              icon={TrendingUp}
            />
          </>
        ) : (
          <>
            <Stat
              label="Faturamento"
              value="R$ 54.420"
              delta="14,2%"
              icon={Wallet}
            />
            <Stat
              label="Projetos ativos"
              value="12"
              delta="8,4%"
              icon={FolderKanban}
            />
            <Stat
              label="Clientes ativos"
              value="28"
              delta="6,1%"
              icon={Users}
            />
            <Stat
              label="Taxa de conversão"
              value="32,8%"
              delta="4,7%"
              icon={TrendingUp}
            />
          </>
        )}
      </div>
      <div className="dashGrid">
        <Chart jewel={jewel} />
        <div className="card schedule">
          <div className="cardHead">
            <div>
              <h3>Próximos compromissos</h3>
              <p>Hoje, 20 de julho</p>
            </div>
            <button>Ver agenda</button>
          </div>
          {events.map((e) => (
            <div className="event" key={e[0]}>
              <b>{e[0]}</b>
              <i className={e[2]} />
              <span>
                <strong>{e[1]}</strong>
                <small>Compartilhado</small>
              </span>
              <ChevronRight />
            </div>
          ))}
        </div>
      </div>
      <div className="bottomGrid">
        <div className="card">
          <div className="cardHead">
            <div>
              <h3>{jewel ? "Pedidos recentes" : "Projetos em andamento"}</h3>
              <p>
                {jewel
                  ? "Últimas movimentações da loja"
                  : "Acompanhe suas entregas"}
              </p>
            </div>
            <button>Ver todos</button>
          </div>
          {(jewel
            ? [
                "Pedido #1048 · Marina Costa",
                "Pedido #1047 · Ana Luiza",
                "Pedido #1046 · Carla Mendes",
              ]
            : [
                "Nuvem Analytics · Dashboard",
                "Estúdio Lume · E-commerce",
                "Clínica Vitta · Aplicativo",
              ]
          ).map((x, i) => (
            <div className="project" key={x}>
              <span className={jewel ? "pj gold" : "pj"}>
                {jewel ? <Gem /> : <Code2 />}
              </span>
              <div>
                <b>{x}</b>
                <small>
                  {jewel
                    ? [
                        "R$ 489 · Pagamento aprovado",
                        "R$ 320 · Separando",
                        "R$ 760 · Enviado",
                      ][i]
                    : [
                        "Next.js · Supabase",
                        "Shopify · Framer",
                        "React Native · Node",
                      ][i]}
                </small>
              </div>
              <span className="percent">{[72, 48, 89][i]}%</span>
            </div>
          ))}
        </div>
        <div className="card shared">
          <div className="cardHead">
            <div>
              <h3>Meta em destaque</h3>
              <p>Espaço compartilhado</p>
            </div>
            <Target />
          </div>
          <div className="sharedTitle">
            <span>✈️</span>
            <div>
              <b>Viagem para Itália</b>
              <small>R$ 14.800 de R$ 30.000</small>
            </div>
          </div>
          <div className="progress">
            <i style={{ width: "49%" }} />
          </div>
          <div className="goalBottom">
            <b>49% concluído</b>
            <span>15 Nov 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}
type RecordItem = {
  id: number;
  title: string;
  subtitle: string;
  value: string;
  status: string;
  date: string;
};
const moduleSeed: Record<string, RecordItem[]> = {
  CRM: [
    {
      id: 1,
      title: "Marina — Aurora Tech",
      subtitle: "Instagram · Indicação",
      value: "R$ 18.000",
      status: "Negociação",
      date: "Hoje, 14:30",
    },
    {
      id: 2,
      title: "Ricardo — Studio Norte",
      subtitle: "WhatsApp · Site",
      value: "R$ 9.500",
      status: "Orçamento enviado",
      date: "Amanhã",
    },
    {
      id: 3,
      title: "Beatriz — Clínica Vitta",
      subtitle: "E-mail · Indicação",
      value: "R$ 24.000",
      status: "Interessado",
      date: "24 Jul",
    },
  ],
  Projetos: [
    {
      id: 1,
      title: "Nuvem Analytics",
      subtitle: "Next.js · Supabase",
      value: "R$ 18.000",
      status: "Em andamento",
      date: "28 Ago",
    },
    {
      id: 2,
      title: "Estúdio Lume",
      subtitle: "E-commerce · Framer",
      value: "R$ 9.500",
      status: "Revisão",
      date: "04 Ago",
    },
    {
      id: 3,
      title: "Clínica Vitta",
      subtitle: "React Native · Node",
      value: "R$ 24.000",
      status: "Planejamento",
      date: "18 Set",
    },
  ],
  Financeiro: [
    {
      id: 1,
      title: "Projeto Nuvem — Parcela 2",
      subtitle: "Receita · Serviços",
      value: "R$ 6.000",
      status: "Recebido",
      date: "20 Jul",
    },
    {
      id: 2,
      title: "Infraestrutura e assinaturas",
      subtitle: "Despesa · Operacional",
      value: "- R$ 1.240",
      status: "Pago",
      date: "18 Jul",
    },
    {
      id: 3,
      title: "Venda Pedido #1048",
      subtitle: "Receita · Produtos",
      value: "R$ 489",
      status: "Recebido",
      date: "17 Jul",
    },
  ],
  Agenda: [
    {
      id: 1,
      title: "Reunião Projeto Nuvem",
      subtitle: "Google Meet · Cliente",
      value: "10:00",
      status: "Confirmado",
      date: "Hoje",
    },
    {
      id: 2,
      title: "Follow-up Studio Norte",
      subtitle: "WhatsApp · Comercial",
      value: "14:30",
      status: "Pendente",
      date: "Hoje",
    },
    {
      id: 3,
      title: "Entrega E-commerce Lume",
      subtitle: "Apresentação · Projeto",
      value: "09:00",
      status: "Confirmado",
      date: "24 Jul",
    },
  ],
  Estoque: [
    {
      id: 1,
      title: "Colar Aurora",
      subtitle: "SKU AUR-001 · Coleção Aurora",
      value: "R$ 289",
      status: "32 unidades",
      date: "Atualizado hoje",
    },
    {
      id: 2,
      title: "Brinco Lumière",
      subtitle: "SKU LUM-014 · Dourado",
      value: "R$ 159",
      status: "8 unidades",
      date: "Estoque baixo",
    },
    {
      id: 3,
      title: "Pulseira Elos",
      subtitle: "SKU ELO-008 · Clássicos",
      value: "R$ 219",
      status: "24 unidades",
      date: "Atualizado ontem",
    },
  ],
  Clientes: [
    {
      id: 1,
      title: "Marina Costa",
      subtitle: "São Paulo · @marinacosta",
      value: "R$ 2.840",
      status: "Cliente VIP",
      date: "Há 2 dias",
    },
    {
      id: 2,
      title: "Ana Luiza",
      subtitle: "Campinas · @annalu",
      value: "R$ 1.460",
      status: "Ativo",
      date: "Há 5 dias",
    },
    {
      id: 3,
      title: "Carla Mendes",
      subtitle: "Santos · @carlam",
      value: "R$ 3.220",
      status: "Cliente VIP",
      date: "Há 1 semana",
    },
  ],
  Fornecedores: [
    {
      id: 1,
      title: "Lumi Metais",
      subtitle: "Fernanda · (11) 99999-1020",
      value: "Prazo 7 dias",
      status: "Ativo",
      date: "Pedido em 12 Jul",
    },
    {
      id: 2,
      title: "Casa das Pedras",
      subtitle: "Roberto · contato@casapedras.com",
      value: "Prazo 12 dias",
      status: "Ativo",
      date: "Pedido em 08 Jul",
    },
  ],
  Pedidos: [
    {
      id: 1,
      title: "Pedido #1048 — Marina Costa",
      subtitle: "3 itens · PIX",
      value: "R$ 489",
      status: "Pagamento aprovado",
      date: "Hoje, 09:42",
    },
    {
      id: 2,
      title: "Pedido #1047 — Ana Luiza",
      subtitle: "2 itens · Cartão",
      value: "R$ 320",
      status: "Separando",
      date: "Ontem, 18:10",
    },
    {
      id: 3,
      title: "Pedido #1046 — Carla Mendes",
      subtitle: "4 itens · Cartão",
      value: "R$ 760",
      status: "Enviado",
      date: "18 Jul",
    },
  ],
};
const moduleInfo: Record<string, [string, string]> = {
  CRM: ["Gerencie seu funil comercial e próximos contatos.", "lead"],
  Projetos: ["Acompanhe prazos, valores e entregas.", "projeto"],
  Financeiro: ["Controle entradas, saídas e fluxo de caixa.", "lançamento"],
  Agenda: ["Organize reuniões, entregas e follow-ups.", "compromisso"],
  Estoque: ["Produtos, quantidades, preços e alertas.", "produto"],
  Clientes: ["Relacionamento e histórico de compras.", "cliente"],
  Fornecedores: ["Contatos, produtos e prazos de fornecimento.", "fornecedor"],
  Pedidos: ["Acompanhe vendas da aprovação à entrega.", "pedido"],
};
function OperationalModule({ name, owner }: { name: string; owner: string }) {
  const key = `nexo-${owner}-${name}`;
  const [items, setItems] = useState<RecordItem[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(key) || "null") ||
        moduleSeed[name] ||
        []
      );
    } catch {
      return moduleSeed[name] || [];
    }
  });
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    subtitle: "",
    value: "",
    status: "Novo",
    date: "",
  });
  const save = (next: RecordItem[]) => {
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  const add = () => {
    if (!draft.title.trim()) return;
    save([{ id: Date.now(), ...draft, date: draft.date || "Hoje" }, ...items]);
    setDraft({ title: "", subtitle: "", value: "", status: "Novo", date: "" });
    setShow(false);
  };
  const visible = items.filter((x) =>
    (x.title + x.subtitle + x.status)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const isGiovanna = owner === "giovanna";
  const gioIdentity: Record<string, { label: string; note: string; icon: any; metric: string }> = {
    Estoque: { label: "ATELIÊ DE PRODUTOS", note: "Curadoria, coleções e disponibilidade das peças.", icon: Package, metric: "64 peças disponíveis" },
    Clientes: { label: "RELACIONAMENTO", note: "Conheça preferências e encante em cada contato.", icon: Users, metric: "2 clientes VIP" },
    Fornecedores: { label: "REDE DE PARCEIROS", note: "Abastecimento, materiais e prazos sob controle.", icon: Truck, metric: "Prazo médio: 9 dias" },
    Pedidos: { label: "CENTRAL DE PEDIDOS", note: "Da confirmação do pagamento até a entrega.", icon: ShoppingBag, metric: "R$ 1.569 em pedidos" },
  };
  const identity = gioIdentity[name];
  const IdentityIcon = identity?.icon || Gem;
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">{identity?.label || "MÓDULO OPERACIONAL"}</span>
          <h1>{name}</h1>
          <p>{identity?.note || moduleInfo[name]?.[0]}</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <Plus />
          Novo {moduleInfo[name]?.[1]}
        </button>
      </div>
      {isGiovanna && identity && <motion.section initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`gioModuleHero identity-${name.toLowerCase()}`} aria-label={`Resumo de ${name}`}><div className="gioHeroIcon"><IdentityIcon /></div><div><small>{identity.label}</small><b>{identity.metric}</b><span>{identity.note}</span></div><Gem className="gioWatermark" /></motion.section>}
      <div className={`moduleKpis ${isGiovanna ? `gioKpis identity-${name.toLowerCase()}` : ""}`}>
        <div>
          <small>Registros</small>
          <b>{items.length}</b>
          <span>ativos no módulo</span>
        </div>
        <div>
          <small>Atualizados hoje</small>
          <b>{Math.min(items.length, 3)}</b>
          <span>movimentações recentes</span>
        </div>
        <div>
          <small>Operação</small>
          <b>Em dia</b>
          <span>dados salvos automaticamente</span>
        </div>
      </div>
      <div className={`card moduleCard ${isGiovanna ? `gioModule identity-${name.toLowerCase()}` : ""}`}>
        <div className="moduleTools">
          <div className="moduleSearch">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar em ${name.toLowerCase()}...`}
            />
          </div>
          <button className="filterBtn">Todos os status ⌄</button>
        </div>
        <div className="moduleTable">
          <div className="tableHeader">
            <span>Nome / descrição</span>
            <span>Valor</span>
            <span>Status</span>
            <span>Data</span>
            <span />
          </div>
          {visible.map((x, i) => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="tableRow"
              key={x.id}
            >
              <div className="rowTitle">
                <i>{isGiovanna && name === "Estoque" ? ["✦","◇","○"][i%3] : x.title[0]}</i>
                <span>
                  <b>{x.title}</b>
                  <small>{x.subtitle || "Sem descrição"}</small>
                </span>
              </div>
              <strong>{x.value || "—"}</strong>
              <button
                className="statusPill"
                onClick={() =>
                  save(
                    items.map((y) =>
                      y.id === x.id
                        ? {
                            ...y,
                            status:
                              y.status === "Concluído"
                                ? "Em andamento"
                                : "Concluído",
                          }
                        : y,
                    ),
                  )
                }
              >
                {x.status}
              </button>
              <span className="rowDate">{x.date}</span>
              <button
                className="rowDelete"
                onClick={() => {
                  if (confirm("Excluir este registro?"))
                    save(items.filter((y) => y.id !== x.id));
                }}
              >
                ×
              </button>
            </motion.div>
          ))}
          {!visible.length && (
            <div className="empty">
              <Search />
              <b>Nenhum registro encontrado</b>
              <span>Tente outra busca ou crie um novo item.</span>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {show && (
          <div className="modalBg" onClick={() => setShow(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close" onClick={() => setShow(false)}>
                <X />
              </button>
              <span className="eyebrow">NOVO REGISTRO</span>
              <h2>Adicionar {moduleInfo[name]?.[1]}</h2>
              <label>
                Nome
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="Nome ou título"
                />
              </label>
              <label>
                Descrição
                <input
                  value={draft.subtitle}
                  onChange={(e) =>
                    setDraft({ ...draft, subtitle: e.target.value })
                  }
                  placeholder="Detalhes, contato ou categoria"
                />
              </label>
              <div className="formRow">
                <label>
                  Valor / referência
                  <input
                    value={draft.value}
                    onChange={(e) =>
                      setDraft({ ...draft, value: e.target.value })
                    }
                    placeholder="R$ 0,00"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({ ...draft, status: e.target.value })
                    }
                  >
                    <option>Novo</option>
                    <option>Em andamento</option>
                    <option>Pendente</option>
                    <option>Concluído</option>
                  </select>
                </label>
              </div>
              <label>
                Data
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
              <button className="primary full" onClick={add}>
                Salvar registro
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
function App() {
  const [user, setUser] = useState<"gabriel" | "giovanna" | null>(null),
    [page, setPage] = useState("Visão geral"),
    [open, setOpen] = useState(() => window.innerWidth > 720);
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 720) setOpen(true); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  if (!user) return <Login go={setUser} />;
  let jewel = user === "giovanna",
    menu = jewel ? menuGiovanna : menuGabriel;
  return (
    <div className={"app " + (jewel ? "jewel" : "")}>
      <a className="skipLink" href="#main-content">Pular para o conteúdo</a>
      <aside aria-label="Navegação principal" className={open ? "" : "collapsed"}>
        <div className="logo">
          <div>{jewel ? <Gem /> : <Code2 />}</div>
          <span>
            <b>{jewel ? "MAISON G." : "NEXO"}</b>
            <small>{jewel ? "SEMI JOIAS" : "SOFTWARE"}</small>
          </span>
        </div>
        <button aria-label={open ? "Recolher menu" : "Expandir menu"} aria-expanded={open} className="collapse" onClick={() => setOpen(!open)}>
          <PanelLeftClose />
        </button>
        <nav aria-label="Módulos do sistema" onClick={() => { if (window.innerWidth <= 720) setOpen(false); }}>
          <small>PRINCIPAL</small>
          {menu.map(([I, n]: any) => (
            <button
              className={page === n ? "active" : ""}
              onClick={() => setPage(n)}
              key={n}
            >
              <I />
              <span>{n}</span>
              {n === "CRM" && <em>8</em>}
            </button>
          ))}
          <small>COMPARTILHADO</small>
          <button
            className={page === "Metas" ? "active" : ""}
            onClick={() => setPage("Metas")}
          >
            <Target />
            <span>Metas em conjunto</span>
            <em>3</em>
          </button>
          <button
            className={page === "Calendário" ? "active" : ""}
            onClick={() => setPage("Calendário")}
          >
            <CalendarDays />
            <span>Calendário</span>
          </button>
        </nav>
        <div className="sideBottom">
          <button>
            <Command />
            <span>Atalhos</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="user" onClick={() => setUser(null)}>
            <span className={"avatarMini " + (jewel ? "gio" : "gab")}>
              {jewel ? "J" : "G"}
            </span>
            <span>
              <b>{jewel ? "Giovanna" : "Gabriel"}</b>
              <small>Trocar perfil</small>
            </span>
          </div>
        </div>
      </aside>
      {open && <button className="mobileOverlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
      <main id="main-content" tabIndex={-1}>
        <header>
          <button aria-label="Abrir menu" aria-expanded={open} className="mobile" onClick={() => setOpen(!open)}>
            <Menu />
          </button>
          <div className="search">
            <Search />
            <label className="sr-only" htmlFor="global-search">Pesquisa global</label>
            <input id="global-search" placeholder="Buscar em tudo..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="headActions">
            <button aria-label="Abrir notificações">
              <Bell />
              <i />
            </button>
            <div className="divider" />
            <div className="company">
              <span className={"avatarMini " + (jewel ? "gio" : "gab")}>
                {jewel ? "G" : "N"}
              </span>
              <span>
                <b>{jewel ? "Maison G." : "Nexo Software"}</b>
                <small>{jewel ? "Semi Joias" : "Desenvolvimento"}</small>
              </span>
            </div>
          </div>
        </header>
        <div className="content">
          {page === "Metas" ? (
            <Goals />
          ) : page === "Calendário" ? (
            <Calendar />
          ) : page === "Financeiro" ? (
            <FinancePage owner={user} />
          ) : page === "Agenda" ? (
            <AgendaPage owner={user} />
          ) : page === "Visão geral" ? (
            <ProfessionalDashboard owner={user} onNavigate={setPage} />
          ) : (
            <OperationalModule name={page} owner={user} />
          )}
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <div className="min-h-screen bg-[#101115] antialiased selection:bg-blue-500/30">
    <App />
  </div>,
);
