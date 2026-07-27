import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, History, Search } from "lucide-react";
import {
  ActivityLogRow,
  CompanySlug,
  listActivityLogs,
  listObjectiveParticipants,
  ObjectiveParticipant,
} from "./services/data";
import { APP_VERSION } from "./app-version";

const labels: Record<string, string> = {
  products: "Produto",
  customers: "Cliente",
  orders: "Pedido",
  transactions: "Financeiro",
  financial_accounts: "Conta",
  records: "Registro",
  events: "Agenda",
};
const actions = {
  INSERT: "criou",
  UPDATE: "atualizou",
  DELETE: "excluiu",
};

export function ActivityLogPage({ owner }: { owner: CompanySlug }) {
  const [items, setItems] = useState<ActivityLogRow[]>([]);
  const [people, setPeople] = useState<ObjectiveParticipant[]>([]);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("Todos");
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([listActivityLogs(owner), listObjectiveParticipants()])
      .then(([logs, profiles]) => {
        setItems(logs);
        setPeople(profiles);
      })
      .catch(() =>
        setError("Execute audit-v1.7-migration.sql para ativar o histórico."),
      );
  }, [owner]);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (entity === "Todos" || item.entity === entity) &&
          `${item.summary} ${item.entity} ${item.action}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, entity],
  );
  return (
    <div className="activityPage">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">SEGURANÇA · v{APP_VERSION}</span>
          <h1>Histórico de atividades</h1>
          <p>Veja quem criou, alterou ou excluiu dados da empresa.</p>
        </div>
      </div>
      {error && <div className="dataError">{error}</div>}
      <section className="card activityLogCard">
        <div className="activityFilters">
          <div className="moduleSearch">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar no histórico..."
            />
          </div>
          <label>
            <Filter />
            <select
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            >
              <option>Todos</option>
              {[...new Set(items.map((item) => item.entity))].map((value) => (
                <option value={value} key={value}>
                  {labels[value] || value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="activityTimeline">
          {visible.map((item) => {
            const person = people.find((entry) => entry.id === item.actor_id);
            return (
              <article key={item.id}>
                <i>{(person?.display_name || "S").slice(0, 1).toUpperCase()}</i>
                <span>
                  <b>
                    {person?.display_name || "Sistema"} {actions[item.action]}{" "}
                    {labels[item.entity] || item.entity}
                  </b>
                  <small>{item.summary || "Sem descrição"}</small>
                </span>
                <time>
                  <Clock3 />
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </time>
              </article>
            );
          })}
          {!visible.length && (
            <div className="empty">
              <History />
              <b>Nenhuma atividade encontrada</b>
              <span>As próximas mudanças aparecerão aqui.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
