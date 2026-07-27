import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  ListChecks,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  createObjective,
  listObjectiveParticipants,
  listObjectives,
  Objective,
  ObjectiveParticipant,
  toggleObjectiveCheckin,
} from "./services/data";
import { supabase } from "./utils/supabase";

const iso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialDraft = () => ({
  title: "",
  description: "",
  type: "challenge" as "calendar" | "challenge",
  start: iso(new Date()),
  days: "50",
  visibility: "individual" as "individual" | "shared",
  activities: ["Ler um livro", "Correr"],
});

export function ObjectivesPage() {
  const [items, setItems] = useState<Objective[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmCompletion, setConfirmCompletion] = useState<boolean | null>(
    null,
  );
  const [success, setSuccess] = useState("");
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<string[]>([]);
  const [progressResult, setProgressResult] = useState<number | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [currentUserId, setCurrentUserId] = useState("");
  const [participants, setParticipants] = useState<ObjectiveParticipant[]>([]);
  const [draft, setDraft] = useState(initialDraft);

  const load = () => {
    setError("");
    return Promise.all([
      listObjectives(),
      listObjectiveParticipants(),
      supabase.auth.getUser(),
    ])
      .then(([data, people, auth]) => {
        setItems(data);
        setParticipants(people);
        setCurrentUserId(auth.data.user?.id || "");
        setSelectedId((current) => current || data[0]?.id || "");
      })
      .catch(() =>
        setError(
          "Execute objectives-migration.sql no Supabase para ativar este módulo.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  const objective = items.find((item) => item.id === selectedId);
  const days = useMemo(() => {
    if (!objective) return [];
    if (objective.calendar_type === "challenge") {
      return Array.from({ length: objective.total_days || 1 }, (_, index) => ({
        key: `day-${index + 1}`,
        label: index + 1,
        caption: `Dia ${index + 1}`,
      }));
    }

    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const offset = new Date(year, monthIndex, 1).getDay();
    return [
      ...Array.from({ length: offset }, (_, index) => ({
        key: `empty-${index}`,
        label: "",
        caption: "",
      })),
      ...Array.from({ length: count }, (_, index) => {
        const date = new Date(year, monthIndex, index + 1);
        return {
          key: iso(date),
          label: index + 1,
          caption: date.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
        };
      }),
    ];
  }, [objective, month]);

  useEffect(() => {
    if (objective && days.length) {
      setSelectedDay((current) =>
        days.some((day) => day.key === current)
          ? current
          : days.find((day) => day.label)?.key || "",
      );
    }
  }, [objective?.id, days]);

  const dayCheckins = (key: string, userId = currentUserId) =>
    objective?.checkins.filter(
      (checkin) => checkin.day_key === key && checkin.completed_by === userId,
    ) || [];
  const openDay = (key: string) => {
    setSelectedDay(key);
    setPendingActivities(
      objective?.checkins
        .filter(
          (checkin) =>
            checkin.day_key === key && checkin.completed_by === currentUserId,
        )
        .map((checkin) => checkin.activity_id) || [],
    );
    setProgressResult(null);
    setDayPanelOpen(true);
  };
  const isDayComplete = (key: string, userId = currentUserId) =>
    !!objective?.activities.length &&
    dayCheckins(key, userId).length === objective.activities.length;
  const totalDays = days.filter((day) => day.label).length;
  const completedDays = objective
    ? days.filter((day) => day.label && isDayComplete(day.key)).length
    : 0;

  const toggle = async (activityId: string) => {
    if (!objective || !selectedDay) return;
    const exists = objective.checkins.some(
      (checkin) =>
        checkin.activity_id === activityId &&
        checkin.day_key === selectedDay &&
        checkin.completed_by === currentUserId,
    );
    setItems((current) =>
      current.map((item) =>
        item.id !== objective.id
          ? item
          : {
              ...item,
              checkins: exists
                ? item.checkins.filter(
                    (checkin) =>
                      !(
                        checkin.activity_id === activityId &&
                        checkin.day_key === selectedDay &&
                        checkin.completed_by === currentUserId
                      ),
                  )
                : [
                    ...item.checkins,
                    {
                      id: `temp-${Date.now()}`,
                      activity_id: activityId,
                      day_key: selectedDay,
                      completed_by: currentUserId,
                    },
                  ],
            },
      ),
    );
    try {
      await toggleObjectiveCheckin(
        objective.id,
        activityId,
        selectedDay,
        !exists,
      );
    } catch {
      setError("Não foi possível atualizar esta atividade.");
      void load();
    }
  };

  const submit = async () => {
    const activities = draft.activities
      .map((item) => item.trim())
      .filter(Boolean);
    if (!draft.title.trim() || !activities.length) return;
    try {
      await createObjective({
        title: draft.title.trim(),
        description: draft.description.trim(),
        calendar_type: draft.type,
        start_date: draft.start,
        total_days:
          draft.type === "challenge"
            ? Math.max(1, Math.min(366, Number(draft.days)))
            : null,
        visibility: draft.visibility,
        color: "#7c6cff",
        activities,
      });
      setOpen(false);
      setDraft(initialDraft());
      setLoading(true);
      setSelectedId("");
      setSelectedDay("");
      await load();
    } catch {
      setError("Não foi possível criar o objetivo.");
    }
  };

  const setDayCompleted = async (complete: boolean) => {
    if (!objective || !selectedDay || !currentUserId) return;
    setError("");
    try {
      await Promise.all(
        objective.activities.map((activity) => {
          const checked = objective.checkins.some(
            (checkin) =>
              checkin.activity_id === activity.id &&
              checkin.day_key === selectedDay &&
              checkin.completed_by === currentUserId,
          );
          if (checked === complete) return Promise.resolve();
          return toggleObjectiveCheckin(
            objective.id,
            activity.id,
            selectedDay,
            complete,
          );
        }),
      );
      await load();
      setSuccess(
        complete ? "Dia concluído com sucesso." : "Conclusão desfeita.",
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Não foi possível atualizar a conclusão deste dia.");
    }
  };

  const confirmDayProgress = async () => {
    if (!objective || !selectedDay) return;
    try {
      await Promise.all(
        objective.activities.map((activity) => {
          const saved = objective.checkins.some(
            (checkin) =>
              checkin.activity_id === activity.id &&
              checkin.day_key === selectedDay &&
              checkin.completed_by === currentUserId,
          );
          const selected = pendingActivities.includes(activity.id);
          return saved === selected
            ? Promise.resolve()
            : toggleObjectiveCheckin(
                objective.id,
                activity.id,
                selectedDay,
                selected,
              );
        }),
      );
      const percentage = objective.activities.length
        ? Math.round(
            (pendingActivities.length / objective.activities.length) * 100,
          )
        : 0;
      setProgressResult(percentage);
      await load();
    } catch {
      setError("Não foi possível confirmar o progresso.");
    }
  };

  return (
    <div className="objectivesPage">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">EVOLUÇÃO DIÁRIA</span>
          <h1>Objetivos</h1>
          <p>Transforme metas em ações consistentes, um dia de cada vez.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <Plus /> Novo objetivo
        </button>
      </div>

      {error && (
        <div className="dataError" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="objectiveLoading">
          <Target />
          <span>Carregando objetivos...</span>
        </div>
      ) : !items.length ? (
        <section className="objectiveWelcome">
          <div>
            <Sparkles />
          </div>
          <span className="eyebrow">COMECE UMA JORNADA</span>
          <h2>Seu próximo objetivo começa hoje</h2>
          <p>
            Crie um calendário mensal ou um desafio com a quantidade exata de
            dias que desejar.
          </p>
          <button className="primary" onClick={() => setOpen(true)}>
            <Plus /> Criar primeiro objetivo
          </button>
        </section>
      ) : (
        <>
          <div className="objectiveTabs" role="tablist">
            {items.map((item) => (
              <button
                role="tab"
                aria-selected={selectedId === item.id}
                className={selectedId === item.id ? "active" : ""}
                onClick={() => {
                  setSelectedId(item.id);
                  setSelectedDay("");
                }}
                key={item.id}
              >
                <span style={{ background: item.color }} />
                <b>{item.title}</b>
                <small>
                  {item.calendar_type === "challenge"
                    ? `${item.total_days} dias`
                    : "Calendário"}
                </small>
              </button>
            ))}
            <button
              className="tabAdd"
              aria-label="Novo objetivo"
              onClick={() => setOpen(true)}
            >
              <Plus />
            </button>
          </div>

          {objective && (
            <>
              <div className="objectiveSummary">
                <div className="objectiveIdentity">
                  <i style={{ background: objective.color }}>
                    <Flame />
                  </i>
                  <span>
                    <small>
                      {objective.calendar_type === "challenge"
                        ? `DESAFIO DE ${objective.total_days} DIAS`
                        : "CALENDÁRIO MENSAL"}
                      {" · "}
                      {objective.visibility === "shared"
                        ? "EM CONJUNTO"
                        : "INDIVIDUAL"}
                    </small>
                    <h2>{objective.title}</h2>
                    <p>
                      {objective.description ||
                        "Mantenha a consistência e avance todos os dias."}
                    </p>
                  </span>
                </div>
                <div className="objectiveStats">
                  <div>
                    <b>{completedDays}</b>
                    <small>dias completos</small>
                  </div>
                  <div>
                    <b>
                      {totalDays
                        ? Math.round((completedDays / totalDays) * 100)
                        : 0}
                      %
                    </b>
                    <small>progresso</small>
                  </div>
                  <div>
                    <b>{objective.activities.length}</b>
                    <small>atividades</small>
                  </div>
                </div>
              </div>

              <div className="objectiveLayout">
                <section className="objectiveCalendar card">
                  <div className="objectiveCalHead">
                    <div>
                      <h3>
                        {objective.calendar_type === "challenge"
                          ? `Jornada de ${objective.total_days} dias`
                          : month.toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                      </h3>
                      <p>Clique em um dia para registrar suas atividades.</p>
                    </div>
                    {objective.calendar_type === "calendar" && (
                      <div>
                        <button
                          aria-label="Mês anterior"
                          onClick={() =>
                            setMonth(
                              new Date(
                                month.getFullYear(),
                                month.getMonth() - 1,
                                1,
                              ),
                            )
                          }
                        >
                          <ChevronLeft />
                        </button>
                        <button onClick={() => setMonth(new Date())}>
                          Hoje
                        </button>
                        <button
                          aria-label="Próximo mês"
                          onClick={() =>
                            setMonth(
                              new Date(
                                month.getFullYear(),
                                month.getMonth() + 1,
                                1,
                              ),
                            )
                          }
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    )}
                  </div>
                  {objective.calendar_type === "calendar" && (
                    <div className="weekdayLabels">
                      {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map(
                        (label) => (
                          <span key={label}>{label}</span>
                        ),
                      )}
                    </div>
                  )}
                  <div className={`objectiveDays ${objective.calendar_type}`}>
                    {days.map((day) =>
                      day.label ? (
                        <button
                          aria-label={day.caption}
                          aria-pressed={selectedDay === day.key}
                          className={`${selectedDay === day.key ? "selected" : ""} ${isDayComplete(day.key) ? "complete" : ""}`}
                          onClick={() => openDay(day.key)}
                          key={day.key}
                        >
                          <span>{day.label}</span>
                          {isDayComplete(day.key) ? (
                            <i>
                              <Check />
                            </i>
                          ) : dayCheckins(day.key).length ? (
                            <small>
                              {dayCheckins(day.key).length}/
                              {objective.activities.length}
                            </small>
                          ) : (
                            <Circle />
                          )}
                        </button>
                      ) : (
                        <span className="emptyDay" key={day.key} />
                      ),
                    )}
                  </div>
                </section>

                <aside
                  className={`dayChecklist card ${
                    dayPanelOpen ? "dayPanelOpen" : ""
                  }`}
                >
                  <button
                    className="closeDayPanel"
                    aria-label="Fechar check-in"
                    onClick={() => setDayPanelOpen(false)}
                  >
                    <X />
                  </button>
                  <div className="checklistHead">
                    <span>
                      <ListChecks />
                      <small>ATIVIDADES DO DIA</small>
                    </span>
                    <h3>
                      {days.find((day) => day.key === selectedDay)?.caption ||
                        "Selecione um dia"}
                    </h3>
                  </div>
                  <div className="dailyProgress">
                    <span>
                      <i
                        style={{
                          width: `${
                            objective.activities.length
                              ? (pendingActivities.length /
                                  objective.activities.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </span>
                    <b>
                      {pendingActivities.length}/{objective.activities.length}
                    </b>
                  </div>
                  <div className="activityChecks">
                    {objective.activities.map((activity) => {
                      const done = pendingActivities.includes(activity.id);
                      return (
                        <button
                          className={done ? "done" : ""}
                          onClick={() =>
                            setPendingActivities((current) =>
                              current.includes(activity.id)
                                ? current.filter((id) => id !== activity.id)
                                : [...current, activity.id],
                            )
                          }
                          key={activity.id}
                        >
                          <i>{done ? <Check /> : <Circle />}</i>
                          <span>{activity.title}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="confirmProgressButton"
                    onClick={() => void confirmDayProgress()}
                  >
                    <CheckCircle2 />
                    Confirmar progresso
                  </button>
                  {progressResult !== null && (
                    <motion.div
                      className="progressCelebration"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <strong>{progressResult}%</strong>
                      <span>do dia concluído</span>
                      <i>
                        <motion.b
                          initial={{ width: 0 }}
                          animate={{ width: `${progressResult}%` }}
                        />
                      </i>
                    </motion.div>
                  )}
                  {objective.visibility === "shared" && (
                    <div className="participantStatus">
                      <small>PROGRESSO DE CADA PESSOA</small>
                      {participants.map((person) => {
                        const done = dayCheckins(selectedDay, person.id).length;
                        return (
                          <div key={person.id}>
                            <i>
                              {person.display_name.slice(0, 1).toUpperCase()}
                            </i>
                            <span>
                              <b>
                                {person.id === currentUserId
                                  ? "Você"
                                  : person.display_name}
                              </b>
                              <small>
                                {done} de {objective.activities.length}{" "}
                                atividades
                              </small>
                            </span>
                            {isDayComplete(selectedDay, person.id) ? (
                              <Check />
                            ) : (
                              <b>
                                {objective.activities.length
                                  ? Math.round(
                                      (done / objective.activities.length) *
                                        100,
                                    )
                                  : 0}
                                %
                              </b>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </>
      )}

      <AnimatePresence>
        {success && (
          <motion.div
            className="objectiveToast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 /> {success}
          </motion.div>
        )}
        {confirmCompletion !== null && (
          <div className="modalBg confirmObjectiveBg">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              className="modal confirmObjective"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <i>{confirmCompletion ? <CheckCircle2 /> : <RotateCcw />}</i>
              <h2>
                {confirmCompletion
                  ? "Concluir este dia?"
                  : "Desfazer a conclusão?"}
              </h2>
              <p>
                {confirmCompletion
                  ? "Todas as atividades serão marcadas como concluídas."
                  : "Todas as marcações deste dia serão removidas."}
              </p>
              <div>
                <button
                  className="secondary"
                  onClick={() => setConfirmCompletion(null)}
                >
                  Cancelar
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    const value = confirmCompletion;
                    setConfirmCompletion(null);
                    void setDayCompleted(value);
                  }}
                >
                  {confirmCompletion ? "Sim, concluir" : "Sim, desfazer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {open && (
          <div className="modalBg" onClick={() => setOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="objective-modal-title"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal objectiveModal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="close"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
              <span className="eyebrow">NOVO OBJETIVO</span>
              <h2 id="objective-modal-title">Criar uma nova jornada</h2>
              <label>
                Nome do objetivo
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  placeholder="Ex: Cuidar da minha saúde"
                />
              </label>
              <label>
                Descrição
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="O que você deseja conquistar?"
                />
              </label>
              <fieldset className="calendarType objectiveVisibility">
                <legend>Participação</legend>
                <button
                  type="button"
                  className={draft.visibility === "individual" ? "active" : ""}
                  onClick={() =>
                    setDraft({ ...draft, visibility: "individual" })
                  }
                >
                  <Target />
                  <span>
                    <b>Individual</b>
                    <small>Somente você acompanha</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={draft.visibility === "shared" ? "active" : ""}
                  onClick={() => setDraft({ ...draft, visibility: "shared" })}
                >
                  <Users />
                  <span>
                    <b>Em conjunto</b>
                    <small>Progresso e notificações para os dois</small>
                  </span>
                </button>
              </fieldset>
              <fieldset className="calendarType">
                <legend>Formato do calendário</legend>
                <button
                  type="button"
                  className={draft.type === "calendar" ? "active" : ""}
                  onClick={() => setDraft({ ...draft, type: "calendar" })}
                >
                  <CalendarDays />
                  <span>
                    <b>Calendário normal</b>
                    <small>Acompanhe por mês e data</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={draft.type === "challenge" ? "active" : ""}
                  onClick={() => setDraft({ ...draft, type: "challenge" })}
                >
                  <Flame />
                  <span>
                    <b>Desafio personalizado</b>
                    <small>Escolha a quantidade de dias</small>
                  </span>
                </button>
              </fieldset>
              <div className="formRow">
                <label>
                  Data de início
                  <input
                    type="date"
                    value={draft.start}
                    onChange={(event) =>
                      setDraft({ ...draft, start: event.target.value })
                    }
                  />
                </label>
                {draft.type === "challenge" && (
                  <label>
                    Quantidade de dias
                    <input
                      type="number"
                      min="1"
                      max="366"
                      value={draft.days}
                      onChange={(event) =>
                        setDraft({ ...draft, days: event.target.value })
                      }
                    />
                  </label>
                )}
              </div>
              <div className="activityBuilder">
                <label>Atividades diárias</label>
                {draft.activities.map((activity, index) => (
                  <div key={index}>
                    <input
                      value={activity}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          activities: draft.activities.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        })
                      }
                      placeholder={`Atividade ${index + 1}`}
                    />
                    {draft.activities.length > 1 && (
                      <button
                        aria-label="Remover atividade"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            activities: draft.activities.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                      >
                        <X />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="addActivity"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      activities: [...draft.activities, ""],
                    })
                  }
                >
                  <Plus /> Adicionar atividade
                </button>
              </div>
              <button className="primary full" onClick={() => void submit()}>
                Criar objetivo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
