import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationRow,
} from "./services/data";
import { supabase } from "./utils/supabase";

export function NotificationCenter({
  onOpenObjective,
}: {
  onOpenObjective: () => void;
}) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const load = () =>
    listNotifications()
      .then(setItems)
      .catch(() => {});

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = items.filter((item) => !item.read_at).length;
  return (
    <div className="notificationWrap" ref={wrap}>
      <button
        className="notificationButton"
        aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell />
        {unread > 0 && <em className="notificationCount">{unread}</em>}
      </button>
      {open && (
        <section className="notificationPanel" aria-label="Notificações">
          <div className="notificationHead">
            <h2>Notificações</h2>
            {unread > 0 && (
              <button
                onClick={async () => {
                  await markAllNotificationsRead();
                  await load();
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          {items.map((item) => (
            <button
              className={`notificationItem ${item.read_at ? "" : "unread"}`}
              key={item.id}
              onClick={async () => {
                if (!item.read_at) await markNotificationRead(item.id);
                setItems((current) =>
                  current.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, read_at: new Date().toISOString() }
                      : entry,
                  ),
                );
                setOpen(false);
                if (item.objective_id) onOpenObjective();
              }}
            >
              <i>
                <CheckCircle2 />
              </i>
              <span>
                <b>{item.title}</b>
                <small>{item.body}</small>
                <small>
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </small>
              </span>
            </button>
          ))}
          {!items.length && (
            <div className="notificationEmpty">Nenhuma notificação ainda.</div>
          )}
        </section>
      )}
    </div>
  );
}
