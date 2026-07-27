import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  createTransaction,
  deleteEvent,
  deleteTransaction,
  listEvents,
  listTransactions,
  updateEvent,
} from "./services/data";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { FinancialPlanning } from "./financial-planning";

type Transaction = {
  id: string | number;
  description: string;
  category: string;
  type: "Entrada" | "Saída";
  amount: number;
  date: string;
  status: "Pago" | "Pendente";
};
type EventItem = {
  id: string | number;
  title: string;
  kind: string;
  date: string;
  time: string;
  shared: boolean;
  done: boolean;
};
const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function FinancePage({ owner }: { owner: "gabriel" | "giovanna" }) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [dataError, setDataError] = useState("");
  useEffect(() => {
    listTransactions(owner)
      .then(setItems)
      .catch(() => setDataError("Não foi possível carregar o financeiro."));
  }, [owner]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    description: "",
    category: "",
    type: "Entrada" as "Entrada" | "Saída",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    status: "Pago" as "Pago" | "Pendente",
  });
  const income = items
      .filter((x) => x.type === "Entrada" && x.status === "Pago")
      .reduce((s, x) => s + x.amount, 0),
    expense = items
      .filter((x) => x.type === "Saída" && x.status === "Pago")
      .reduce((s, x) => s + x.amount, 0);
  const visible = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "Todos" || x.type === filter) &&
          (x.description + x.category)
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );
  const add = async () => {
    if (!draft.description || !Number(draft.amount)) return;
    try {
      const created = await createTransaction(owner, {
        ...draft,
        amount: Number(draft.amount),
      });
      setItems([created, ...items]);
      setOpen(false);
      setDraft({ ...draft, description: "", category: "", amount: "" });
      setDataError("");
    } catch {
      setDataError("Não foi possível salvar o lançamento.");
    }
  };
  const csv = () => {
    const data = [
      "Descrição,Categoria,Tipo,Valor,Data,Status",
      ...items.map(
        (x) =>
          `${x.description},${x.category},${x.type},${x.amount},${x.date},${x.status}`,
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
    a.download = `financeiro-${owner}.csv`;
    a.click();
  };
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">CONTROLE FINANCEIRO</span>
          <h1>Financeiro</h1>
          <p>Fluxo de caixa, receitas e despesas da empresa.</p>
        </div>
        <div className="titleActions">
          <button className="secondary" onClick={csv}>
            <Download />
            Exportar
          </button>
          <button className="primary" onClick={() => setOpen(true)}>
            <Plus />
            Novo lançamento
          </button>
        </div>
      </div>
      <section className="financeSummary" aria-label="Resumo financeiro">
        <article>
          <i className="positive">
            <TrendingUp />
          </i>
          <span>
            <small>Entradas recebidas</small>
            <b>{brl(income)}</b>
          </span>
        </article>
        <article>
          <i className="negative">
            <TrendingDown />
          </i>
          <span>
            <small>Saídas pagas</small>
            <b>{brl(expense)}</b>
          </span>
        </article>
        <article>
          <i>
            <Wallet />
          </i>
          <span>
            <small>Saldo atual</small>
            <b>{brl(income - expense)}</b>
          </span>
        </article>
      </section>
      {dataError && (
        <div className="dataError" role="alert">
          {dataError}
        </div>
      )}
      <section
        className="card advancedCard"
        aria-labelledby="transactions-title"
      >
        <div className="advancedHead">
          <div>
            <h2 id="transactions-title">Lançamentos</h2>
            <p>{visible.length} registros encontrados</p>
          </div>
          <div className="segmented" aria-label="Filtrar por tipo">
            {["Todos", "Entrada", "Saída"].map((x) => (
              <button
                aria-pressed={filter === x}
                className={filter === x ? "selected" : ""}
                onClick={() => setFilter(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="moduleSearch wide">
          <Search />
          <label className="sr-only" htmlFor="finance-search">
            Buscar lançamentos
          </label>
          <input
            id="finance-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
          />
        </div>
        <div className="transactionList">
          {visible.map((x) => (
            <article key={x.id}>
              <i className={x.type === "Entrada" ? "positive" : "negative"}>
                {x.type === "Entrada" ? <TrendingUp /> : <TrendingDown />}
              </i>
              <span className="transactionName">
                <b>{x.description}</b>
                <small>
                  {x.category} ·{" "}
                  {new Date(x.date + "T12:00").toLocaleDateString("pt-BR")}
                </small>
              </span>
              <span className={`badge ${x.status.toLowerCase()}`}>
                {x.status}
              </span>
              <strong className={x.type === "Entrada" ? "income" : "expense"}>
                {x.type === "Entrada" ? "+ " : "- "}
                {brl(x.amount)}
              </strong>
              <button
                aria-label={`Excluir ${x.description}`}
                onClick={() =>
                  deleteTransaction(String(x.id))
                    .then(() => setItems(items.filter((y) => y.id !== x.id)))
                    .catch(() =>
                      setDataError("Não foi possível excluir o lançamento."),
                    )
                }
              >
                ×
              </button>
            </article>
          ))}
          {!visible.length && (
            <div className="empty">
              <Wallet />
              <b>Nenhum lançamento encontrado</b>
              <span>
                Registre uma entrada ou despesa para iniciar o controle
                financeiro.
              </span>
            </div>
          )}
        </div>
      </section>
      <FinancialPlanning owner={owner} />
      <AnimatePresence>
        {open && (
          <div
            className="modalBg"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="finance-modal-title"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
              <span className="eyebrow">NOVO LANÇAMENTO</span>
              <h2 id="finance-modal-title">Registrar movimentação</h2>
              <label>
                Descrição
                <input
                  autoFocus
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <div className="formRow">
                <label>
                  Tipo
                  <select
                    value={draft.type}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        type: e.target.value as "Entrada" | "Saída",
                      })
                    }
                  >
                    <option>Entrada</option>
                    <option>Saída</option>
                  </select>
                </label>
                <label>
                  Valor
                  <input
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        amount: e.target.value.replace(",", "."),
                      })
                    }
                    placeholder="0,00"
                  />
                </label>
              </div>
              <label>
                Categoria
                <input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                />
              </label>
              <div className="formRow">
                <label>
                  Data
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        status: e.target.value as "Pago" | "Pendente",
                      })
                    }
                  >
                    <option>Pago</option>
                    <option>Pendente</option>
                  </select>
                </label>
              </div>
              <button className="primary full" onClick={add}>
                Salvar lançamento
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
export function AgendaPage({ owner }: { owner: "gabriel" | "giovanna" }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [dataError, setDataError] = useState("");
  useEffect(() => {
    listEvents(owner)
      .then(setItems)
      .catch(() => setDataError("Não foi possível carregar a agenda."));
  }, [owner]);
  const [open, setOpen] = useState(false);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const startOfCurrentWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay(),
    12,
  );
  const [weekStart, setWeekStart] = useState(startOfCurrentWeek);
  const [day, setDay] = useState(todayKey);
  const [draft, setDraft] = useState({
    title: "",
    kind: "Reunião",
    date: day,
    time: "09:00",
    shared: false,
    done: false,
  });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const moveWeek = (direction: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + direction * 7);
    setWeekStart(next);
    setDay(next.toISOString().slice(0, 10));
  };
  const weekLabel = `${days[0].toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} — ${days[6].toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
  const add = async () => {
    if (!draft.title) return;
    try {
      const created = await createEvent(owner, draft);
      setItems([created, ...items]);
      setOpen(false);
      setDraft({ ...draft, title: "" });
      setDataError("");
    } catch {
      setDataError("Não foi possível salvar o compromisso.");
    }
  };
  const selected = items
    .filter((x) => x.date === day)
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">AGENDA DA EMPRESA</span>
          <h1>Agenda</h1>
          <p>Reuniões, entregas, tarefas e compromissos.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <Plus />
          Novo compromisso
        </button>
      </div>
      <section className="agendaLayout">
        <div className="card weekAgenda">
          <div className="agendaNav">
            <button aria-label="Semana anterior" onClick={() => moveWeek(-1)}>
              <ChevronLeft />
            </button>
            <h2>{weekLabel}</h2>
            <button aria-label="Próxima semana" onClick={() => moveWeek(1)}>
              <ChevronRight />
            </button>
          </div>
          <div className="dayStrip">
            {days.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              return (
                <button
                  aria-pressed={day === iso}
                  className={day === iso ? "active" : ""}
                  onClick={() => setDay(iso)}
                  key={iso}
                >
                  <small>
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </small>
                  <b>{d.getDate()}</b>
                  <i>{items.filter((x) => x.date === iso).length || ""}</i>
                </button>
              );
            })}
          </div>
          <div className="dayEvents">
            <h3>
              {new Date(day + "T12:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            {selected.map((x) => (
              <article className={x.done ? "done" : ""} key={x.id}>
                <time>{x.time}</time>
                <i />
                <span>
                  <b>{x.title}</b>
                  <small>
                    {x.kind} · {x.shared ? "Compartilhado" : "Privado"}
                  </small>
                </span>
                <label className="checkLabel">
                  <input
                    type="checkbox"
                    checked={x.done}
                    onChange={() => {
                      const done = !x.done;
                      setItems(
                        items.map((y) => (y.id === x.id ? { ...y, done } : y)),
                      );
                      updateEvent(String(x.id), { done }).catch(() =>
                        setDataError(
                          "Não foi possível atualizar o compromisso.",
                        ),
                      );
                    }}
                  />
                  <span className="sr-only">
                    Marcar {x.title} como concluído
                  </span>
                </label>
                <button
                  aria-label={`Excluir ${x.title}`}
                  onClick={() =>
                    deleteEvent(String(x.id))
                      .then(() => setItems(items.filter((y) => y.id !== x.id)))
                      .catch(() =>
                        setDataError("Não foi possível excluir o compromisso."),
                      )
                  }
                >
                  ×
                </button>
              </article>
            ))}
            {!selected.length && (
              <div className="empty compact">
                <CalendarDays />
                <b>Dia livre</b>
                <span>Nenhum compromisso para esta data.</span>
              </div>
            )}
          </div>
        </div>
        <aside className="card agendaAside">
          <h3>Resumo da semana</h3>
          <div>
            <b>{items.filter((x) => !x.done).length}</b>
            <span>pendentes</span>
          </div>
          <div>
            <b>{items.filter((x) => x.shared).length}</b>
            <span>compartilhados</span>
          </div>
          <div>
            <b>{items.filter((x) => x.done).length}</b>
            <span>concluídos</span>
          </div>
        </aside>
      </section>
      <AnimatePresence>
        {open && (
          <div className="modalBg" onClick={() => setOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agenda-modal-title"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
              <span className="eyebrow">NOVO COMPROMISSO</span>
              <h2 id="agenda-modal-title">Adicionar à agenda</h2>
              <label>
                Título
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <div className="formRow">
                <label>
                  Categoria
                  <select
                    value={draft.kind}
                    onChange={(e) =>
                      setDraft({ ...draft, kind: e.target.value })
                    }
                  >
                    <option>Reunião</option>
                    <option>Cliente</option>
                    <option>Entrega</option>
                    <option>Estoque</option>
                    <option>Lançamento</option>
                    <option>Pessoal</option>
                  </select>
                </label>
                <label>
                  Visibilidade
                  <select
                    value={draft.shared ? "Compartilhado" : "Privado"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        shared: e.target.value === "Compartilhado",
                      })
                    }
                  >
                    <option>Privado</option>
                    <option>Compartilhado</option>
                  </select>
                </label>
              </div>
              <div className="formRow">
                <label>
                  Data
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Horário
                  <input
                    type="time"
                    value={draft.time}
                    onChange={(e) =>
                      setDraft({ ...draft, time: e.target.value })
                    }
                  />
                </label>
              </div>
              <button className="primary full" onClick={add}>
                Salvar compromisso
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
