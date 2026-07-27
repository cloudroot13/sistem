import { supabase } from "../utils/supabase";

export type CompanySlug = "gabriel" | "giovanna";
export type RecordRow = {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  status: string;
  date: string;
};
export type TransactionRow = {
  id: string;
  description: string;
  category: string;
  type: "Entrada" | "Saída";
  amount: number;
  date: string;
  status: "Pago" | "Pendente";
};
export type EventRow = {
  id: string;
  title: string;
  kind: string;
  date: string;
  time: string;
  shared: boolean;
  done: boolean;
};

const companyCache = new Map<CompanySlug, string>();

export async function getCompanyId(slug: CompanySlug) {
  const cached = companyCache.get(slug);
  if (cached) return cached;
  const { data, error } = await supabase
    .from("companies")
    .select("id,slug")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  companyCache.set(slug, data.id);
  return data.id as string;
}

export async function listRecords(
  owner: CompanySlug,
  module: string,
): Promise<RecordRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("records")
    .select("id,title,subtitle,value,status,due_date,created_at")
    .eq("company_id", companyId)
    .eq("module", module)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((x) => ({
    id: x.id,
    title: x.title,
    subtitle: x.subtitle || "",
    value: x.value || "",
    status: x.status || "Novo",
    date: x.due_date || "Hoje",
  }));
}

export async function createRecord(
  owner: CompanySlug,
  module: string,
  item: Omit<RecordRow, "id">,
) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("records")
    .insert({
      company_id: companyId,
      module,
      title: item.title,
      subtitle: item.subtitle,
      value: item.value,
      status: item.status,
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : null,
    })
    .select("id,title,subtitle,value,status,due_date")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle || "",
    value: data.value || "",
    status: data.status,
    date: data.due_date || "Hoje",
  } as RecordRow;
}

export async function updateRecord(id: string, changes: Partial<RecordRow>) {
  const payload: any = {};
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.title !== undefined) payload.title = changes.title;
  if (changes.subtitle !== undefined) payload.subtitle = changes.subtitle;
  if (changes.value !== undefined) payload.value = changes.value;
  payload.updated_at = new Date().toISOString();
  const { error } = await supabase.from("records").update(payload).eq("id", id);
  if (error) throw error;
}
export async function deleteRecord(id: string) {
  const { error } = await supabase.from("records").delete().eq("id", id);
  if (error) throw error;
}

export async function listTransactions(
  owner: CompanySlug,
): Promise<TransactionRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("transactions")
    .select("id,description,category,type,amount,transaction_date,status")
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return (data || []).map((x) => ({
    id: x.id,
    description: x.description,
    category: x.category,
    type: x.type,
    amount: Number(x.amount),
    date: x.transaction_date,
    status: x.status,
  }));
}
export async function createTransaction(
  owner: CompanySlug,
  item: Omit<TransactionRow, "id">,
) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      company_id: companyId,
      description: item.description,
      category: item.category,
      type: item.type,
      amount: item.amount,
      transaction_date: item.date,
      status: item.status,
    })
    .select("id,description,category,type,amount,transaction_date,status")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    description: data.description,
    category: data.category,
    type: data.type,
    amount: Number(data.amount),
    date: data.transaction_date,
    status: data.status,
  } as TransactionRow;
}
export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function listEvents(owner: CompanySlug): Promise<EventRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("events")
    .select("id,title,category,starts_at,visibility,completed")
    .or(`company_id.eq.${companyId},visibility.eq.shared`)
    .order("starts_at");
  if (error) throw error;
  return (data || []).map((x) => {
    const d = new Date(x.starts_at);
    return {
      id: x.id,
      title: x.title,
      kind: x.category,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      shared: x.visibility === "shared",
      done: x.completed,
    };
  });
}
export async function createEvent(
  owner: CompanySlug,
  item: Omit<EventRow, "id">,
) {
  const companyId = await getCompanyId(owner);
  const startsAt = new Date(`${item.date}T${item.time}:00`).toISOString();
  const { data, error } = await supabase
    .from("events")
    .insert({
      company_id: companyId,
      title: item.title,
      category: item.kind,
      starts_at: startsAt,
      visibility: item.shared ? "shared" : "private",
      completed: item.done,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { ...item, id: data.id } as EventRow;
}
export async function updateEvent(id: string, changes: Partial<EventRow>) {
  const payload: any = {};
  if (changes.done !== undefined) payload.completed = changes.done;
  const { error } = await supabase.from("events").update(payload).eq("id", id);
  if (error) throw error;
}
export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function listGoals() {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createGoal(item: {
  title: string;
  description: string;
  target_amount: number;
  deadline: string | null;
}) {
  const { data, error } = await supabase
    .from("goals")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type Objective = {
  id: string;
  title: string;
  description: string;
  calendar_type: "calendar" | "challenge";
  start_date: string;
  total_days: number | null;
  visibility: "individual" | "shared";
  color: string;
  created_by: string;
  activities: { id: string; title: string; position: number }[];
  checkins: {
    id: string;
    activity_id: string;
    day_key: string;
    completed_by: string;
  }[];
};
export type ObjectiveParticipant = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};
export async function listObjectives(): Promise<Objective[]> {
  const { data, error } = await supabase
    .from("objectives")
    .select(
      "id,title,description,calendar_type,start_date,total_days,visibility,color,created_by,objective_activities(id,title,position),objective_checkins(id,activity_id,day_key,completed_by)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((x: any) => ({
    ...x,
    activities: (x.objective_activities || []).sort(
      (a: any, b: any) => a.position - b.position,
    ),
    checkins: x.objective_checkins || [],
  }));
}
export async function createObjective(input: {
  title: string;
  description: string;
  calendar_type: "calendar" | "challenge";
  start_date: string;
  total_days: number | null;
  visibility: "individual" | "shared";
  color: string;
  activities: string[];
}) {
  const { data: objective, error } = await supabase
    .from("objectives")
    .insert({
      title: input.title,
      description: input.description,
      calendar_type: input.calendar_type,
      start_date: input.start_date,
      total_days: input.total_days,
      visibility: input.visibility,
      color: input.color,
    })
    .select()
    .single();
  if (error) throw error;
  const { error: activitiesError } = await supabase
    .from("objective_activities")
    .insert(
      input.activities.map((title, position) => ({
        objective_id: objective.id,
        title,
        position,
      })),
    );
  if (activitiesError) {
    await supabase.from("objectives").delete().eq("id", objective.id);
    throw activitiesError;
  }
  return objective;
}
export async function toggleObjectiveCheckin(
  objectiveId: string,
  activityId: string,
  dayKey: string,
  completed: boolean,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão não encontrada.");
  if (completed) {
    const { error } = await supabase.from("objective_checkins").upsert(
      {
        objective_id: objectiveId,
        activity_id: activityId,
        day_key: dayKey,
        completed_by: user.id,
      },
      { onConflict: "activity_id,day_key,completed_by" },
    );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("objective_checkins")
      .delete()
      .eq("activity_id", activityId)
      .eq("day_key", dayKey)
      .eq("completed_by", user.id);
    if (error) throw error;
  }
}

export async function listObjectiveParticipants(): Promise<
  ObjectiveParticipant[]
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_url")
    .order("display_name");
  if (error) throw error;
  return data || [];
}

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  objective_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
};
export async function listNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,objective_id,actor_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}
export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}
export async function deleteObjective(id: string) {
  const { error } = await supabase.from("objectives").delete().eq("id", id);
  if (error) throw error;
}

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  low_stock_at: number;
  active: boolean;
  collection: string;
  image_url: string;
  reserved: number;
  variation: string;
};
export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
};
export type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
  customer: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    unit_price: number;
    product: { name: string; sku: string; cost: number } | null;
  }[];
};

export async function listProducts(owner: CompanySlug): Promise<ProductRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,sku,price,cost,stock,low_stock_at,active,collection,image_url,reserved,variation",
    )
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    price: Number(item.price),
    cost: Number(item.cost),
  }));
}
export async function createProduct(
  owner: CompanySlug,
  item: Omit<ProductRow, "id" | "active">,
) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("products")
    .insert({ ...item, company_id: companyId })
    .select(
      "id,name,sku,price,cost,stock,low_stock_at,active,collection,image_url,reserved,variation",
    )
    .single();
  if (error) throw error;
  return { ...data, price: Number(data.price), cost: Number(data.cost) };
}
export async function updateProduct(
  id: string,
  item: Omit<ProductRow, "id" | "active">,
) {
  const { error } = await supabase
    .from("products")
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
export async function uploadProductImage(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão não encontrada.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file);
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data
    .publicUrl;
}
export async function listCustomers(
  owner: CompanySlug,
): Promise<CustomerRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,phone,email,notes")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return data || [];
}
export async function createCustomer(
  owner: CompanySlug,
  item: Omit<CustomerRow, "id">,
) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...item, company_id: companyId })
    .select("id,name,phone,email,notes")
    .single();
  if (error) throw error;
  return data;
}
export async function updateCustomer(
  id: string,
  item: Omit<CustomerRow, "id">,
) {
  const { error } = await supabase.from("customers").update(item).eq("id", id);
  if (error) throw error;
}
export async function listOrders(owner: CompanySlug): Promise<OrderRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,payment_method,total,created_at,customer:customers(id,name),items:order_items(id,quantity,unit_price,product:products(name,sku,cost))",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    total: Number(item.total),
    items: item.items || [],
  }));
}
export async function createIntegratedOrder(
  owner: CompanySlug,
  input: {
    customerId: string | null;
    payment: string;
    status: "Pendente" | "Pago";
    items: { product_id: string; quantity: number }[];
  },
) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase.rpc("create_integrated_order", {
    requested_company: companyId,
    requested_customer: input.customerId,
    requested_payment: input.payment,
    requested_status: input.status,
    requested_items: input.items,
  });
  if (error) throw error;
  return data as string;
}
export async function cancelIntegratedOrder(orderId: string) {
  const { error } = await supabase.rpc("cancel_integrated_order", {
    requested_order: orderId,
  });
  if (error) throw error;
}
export async function payIntegratedOrder(orderId: string) {
  const { error } = await supabase.rpc("pay_integrated_order", {
    requested_order: orderId,
  });
  if (error) throw error;
}

export type FinancialAccountRow = {
  id: string;
  description: string;
  category: string;
  type: "Pagar" | "Receber";
  amount: number;
  due_date: string;
  status: "Pendente" | "Baixado" | "Cancelado";
  recurrence: "Nenhuma" | "Mensal" | "Anual";
  installment: number;
  installment_total: number;
};
export async function listFinancialAccounts(owner: CompanySlug) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("financial_accounts")
    .select(
      "id,description,category,type,amount,due_date,status,recurrence,installment,installment_total",
    )
    .eq("company_id", companyId)
    .order("due_date");
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    amount: Number(item.amount),
  })) as FinancialAccountRow[];
}
export async function createFinancialAccount(
  owner: CompanySlug,
  input: Omit<FinancialAccountRow, "id" | "status" | "installment">,
) {
  const companyId = await getCompanyId(owner);
  const rows = Array.from({ length: input.installment_total }, (_, index) => {
    const due = new Date(`${input.due_date}T12:00`);
    due.setMonth(due.getMonth() + index);
    return {
      ...input,
      company_id: companyId,
      amount: input.amount / input.installment_total,
      due_date: due.toISOString().slice(0, 10),
      installment: index + 1,
      status: "Pendente",
    };
  });
  const { error } = await supabase.from("financial_accounts").insert(rows);
  if (error) throw error;
}
export async function settleFinancialAccount(id: string) {
  const { error } = await supabase.rpc("settle_financial_account", {
    requested_account: id,
  });
  if (error) throw error;
}

export type ActivityLogRow = {
  id: string;
  actor_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  entity: string;
  entity_id: string | null;
  summary: string;
  changes: Record<string, unknown>;
  created_at: string;
};
export async function listActivityLogs(owner: CompanySlug) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,actor_id,action,entity,entity_id,summary,changes,created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []) as ActivityLogRow[];
}
