import { useEffect, useState } from "react";
import { Check, Clock3, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CompanySlug,
  createFinancialAccount,
  FinancialAccountRow,
  listFinancialAccounts,
  settleFinancialAccount,
} from "./services/data";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinancialPlanning({ owner }: { owner: CompanySlug }) {
  const [items, setItems] = useState<FinancialAccountRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    description: "",
    category: "Geral",
    type: "Pagar" as "Pagar" | "Receber",
    amount: "",
    due_date: new Date().toISOString().slice(0, 10),
    recurrence: "Nenhuma" as "Nenhuma" | "Mensal" | "Anual",
    installments: "1",
  });
  const load = () =>
    listFinancialAccounts(owner)
      .then(setItems)
      .catch(() => {
        setError(
          "Execute finance-v1.4-migration.sql para ativar o planejamento.",
        );
      });
  useEffect(() => {
    void load();
  }, [owner]);
  const pending = items.filter((item) => item.status === "Pendente");
  return (
    <>
      <section className="card planningCard">
        <div className="advancedHead">
          <div>
            <h2>Contas a pagar e receber</h2>
            <p>{pending.length} lançamentos previstos</p>
          </div>
          <button className="primary" onClick={() => setOpen(true)}>
            <Plus /> Nova conta
          </button>
        </div>
        {error && <div className="dataError">{error}</div>}
        <div className="planningList">
          {items.map((item) => (
            <article key={item.id}>
              <i className={item.type === "Receber" ? "receive" : "pay"}>
                <Clock3 />
              </i>
              <span>
                <b>{item.description}</b>
                <small>
                  {item.category} · vence{" "}
                  {new Date(`${item.due_date}T12:00`).toLocaleDateString(
                    "pt-BR",
                  )}
                  {item.installment_total > 1 &&
                    ` · ${item.installment}/${item.installment_total}`}
                </small>
              </span>
              <strong>{brl(item.amount)}</strong>
              {item.status === "Pendente" ? (
                <button
                  onClick={async () => {
                    try {
                      await settleFinancialAccount(item.id);
                      await load();
                    } catch {
                      setError("Não foi possível baixar esta conta.");
                    }
                  }}
                >
                  <Check /> Dar baixa
                </button>
              ) : (
                <em>{item.status}</em>
              )}
            </article>
          ))}
          {!items.length && (
            <div className="empty">Nenhuma conta programada.</div>
          )}
        </div>
      </section>
      <AnimatePresence>
        {open && (
          <div className="modalBg" onClick={() => setOpen(false)}>
            <motion.div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setOpen(false)}>
                <X />
              </button>
              <span className="eyebrow">FINANCEIRO · v1.4.0</span>
              <h2>Programar conta</h2>
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
                        type: e.target.value as "Pagar" | "Receber",
                      })
                    }
                  >
                    <option>Pagar</option>
                    <option>Receber</option>
                  </select>
                </label>
                <label>
                  Valor total
                  <input
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft({ ...draft, amount: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="formRow">
                <label>
                  Vencimento
                  <input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) =>
                      setDraft({ ...draft, due_date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Parcelas
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={draft.installments}
                    onChange={(e) =>
                      setDraft({ ...draft, installments: e.target.value })
                    }
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
              <button
                className="primary full"
                onClick={async () => {
                  if (!draft.description || !Number(draft.amount)) return;
                  try {
                    await createFinancialAccount(owner, {
                      description: draft.description,
                      category: draft.category,
                      type: draft.type,
                      amount: Number(draft.amount.replace(",", ".")),
                      due_date: draft.due_date,
                      recurrence: draft.recurrence,
                      installment_total: Number(draft.installments),
                    });
                    setOpen(false);
                    await load();
                  } catch {
                    setError("Não foi possível programar a conta.");
                  }
                }}
              >
                Salvar programação
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
