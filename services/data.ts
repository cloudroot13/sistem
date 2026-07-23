import { supabase } from "../utils/supabase";

export type CompanySlug = "gabriel" | "giovanna";
export type RecordRow = { id: string; title: string; subtitle: string; value: string; status: string; date: string };
export type TransactionRow = { id: string; description: string; category: string; type: "Entrada" | "Saída"; amount: number; date: string; status: "Pago" | "Pendente" };
export type EventRow = { id: string; title: string; kind: string; date: string; time: string; shared: boolean; done: boolean };

const companyCache = new Map<CompanySlug, string>();

export async function getCompanyId(slug: CompanySlug) {
  const cached = companyCache.get(slug); if (cached) return cached;
  const { data, error } = await supabase.from("companies").select("id,slug").eq("slug", slug).single();
  if (error) throw error; companyCache.set(slug, data.id); return data.id as string;
}

export async function listRecords(owner: CompanySlug, module: string): Promise<RecordRow[]> {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase.from("records").select("id,title,subtitle,value,status,due_date,created_at").eq("company_id", companyId).eq("module", module).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(x => ({ id:x.id, title:x.title, subtitle:x.subtitle || "", value:x.value || "", status:x.status || "Novo", date:x.due_date || "Hoje" }));
}

export async function createRecord(owner: CompanySlug, module: string, item: Omit<RecordRow,"id">) {
  const companyId = await getCompanyId(owner);
  const { data, error } = await supabase.from("records").insert({ company_id:companyId, module, title:item.title, subtitle:item.subtitle, value:item.value, status:item.status, due_date:/^\d{4}-\d{2}-\d{2}$/.test(item.date)?item.date:null }).select("id,title,subtitle,value,status,due_date").single();
  if (error) throw error; return { id:data.id, title:data.title, subtitle:data.subtitle || "", value:data.value || "", status:data.status, date:data.due_date || "Hoje" } as RecordRow;
}

export async function updateRecord(id:string, changes:Partial<RecordRow>) {
  const payload:any={}; if(changes.status!==undefined)payload.status=changes.status;if(changes.title!==undefined)payload.title=changes.title;if(changes.subtitle!==undefined)payload.subtitle=changes.subtitle;if(changes.value!==undefined)payload.value=changes.value;payload.updated_at=new Date().toISOString();
  const { error }=await supabase.from("records").update(payload).eq("id",id); if(error)throw error;
}
export async function deleteRecord(id:string){const{error}=await supabase.from("records").delete().eq("id",id);if(error)throw error}

export async function listTransactions(owner:CompanySlug):Promise<TransactionRow[]>{const companyId=await getCompanyId(owner);const{data,error}=await supabase.from("transactions").select("id,description,category,type,amount,transaction_date,status").eq("company_id",companyId).order("transaction_date",{ascending:false});if(error)throw error;return(data||[]).map(x=>({id:x.id,description:x.description,category:x.category,type:x.type,amount:Number(x.amount),date:x.transaction_date,status:x.status}))}
export async function createTransaction(owner:CompanySlug,item:Omit<TransactionRow,"id">){const companyId=await getCompanyId(owner);const{data,error}=await supabase.from("transactions").insert({company_id:companyId,description:item.description,category:item.category,type:item.type,amount:item.amount,transaction_date:item.date,status:item.status}).select("id,description,category,type,amount,transaction_date,status").single();if(error)throw error;return{id:data.id,description:data.description,category:data.category,type:data.type,amount:Number(data.amount),date:data.transaction_date,status:data.status}as TransactionRow}
export async function deleteTransaction(id:string){const{error}=await supabase.from("transactions").delete().eq("id",id);if(error)throw error}

export async function listEvents(owner:CompanySlug):Promise<EventRow[]>{const companyId=await getCompanyId(owner);const{data,error}=await supabase.from("events").select("id,title,category,starts_at,visibility,completed").or(`company_id.eq.${companyId},visibility.eq.shared`).order("starts_at");if(error)throw error;return(data||[]).map(x=>{const d=new Date(x.starts_at);return{id:x.id,title:x.title,kind:x.category,date:d.toISOString().slice(0,10),time:d.toTimeString().slice(0,5),shared:x.visibility==="shared",done:x.completed}})}
export async function createEvent(owner:CompanySlug,item:Omit<EventRow,"id">){const companyId=await getCompanyId(owner);const startsAt=new Date(`${item.date}T${item.time}:00`).toISOString();const{data,error}=await supabase.from("events").insert({company_id:companyId,title:item.title,category:item.kind,starts_at:startsAt,visibility:item.shared?"shared":"private",completed:item.done}).select("id").single();if(error)throw error;return{...item,id:data.id}as EventRow}
export async function updateEvent(id:string,changes:Partial<EventRow>){const payload:any={};if(changes.done!==undefined)payload.completed=changes.done;const{error}=await supabase.from("events").update(payload).eq("id",id);if(error)throw error}
export async function deleteEvent(id:string){const{error}=await supabase.from("events").delete().eq("id",id);if(error)throw error}

export async function listGoals(){const{data,error}=await supabase.from("goals").select("*").order("created_at",{ascending:false});if(error)throw error;return data||[]}
export async function createGoal(item:{title:string;description:string;target_amount:number;deadline:string|null}){const{data,error}=await supabase.from("goals").insert(item).select().single();if(error)throw error;return data}
