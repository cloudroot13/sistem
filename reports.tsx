import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CompanySlug,
  listCustomers,
  listOrders,
  listProducts,
  listTransactions,
  OrderRow,
  TransactionRow,
} from "./services/data";
import { APP_VERSION } from "./app-version";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function ReportsPage({ owner }: { owner: CompanySlug }) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [period, setPeriod] = useState("6");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      listTransactions(owner),
      owner === "giovanna" ? listOrders(owner) : Promise.resolve([]),
      owner === "giovanna" ? listProducts(owner) : Promise.resolve([]),
      owner === "giovanna" ? listCustomers(owner) : Promise.resolve([]),
    ])
      .then(([finance, orderData, products, customers]) => {
        setTransactions(finance);
        setOrders(orderData);
        setProductCount(products.length);
        setCustomerCount(customers.length);
      })
      .catch(() => setError("Não foi possível carregar os relatórios."));
  }, [owner]);

  const cutoff = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - Number(period));
    return date;
  }, [period]);
  const finance = transactions.filter(
    (item) => new Date(`${item.date}T12:00`) >= cutoff,
  );
  const income = finance
    .filter((item) => item.type === "Entrada" && item.status === "Pago")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = finance
    .filter((item) => item.type === "Saída" && item.status === "Pago")
    .reduce((sum, item) => sum + item.amount, 0);
  const validOrders = orders.filter(
    (order) =>
      order.status !== "Cancelado" && new Date(order.created_at) >= cutoff,
  );
  const ticket = validOrders.length
    ? validOrders.reduce((sum, order) => sum + order.total, 0) /
      validOrders.length
    : 0;

  const products = new Map<
    string,
    { name: string; quantity: number; revenue: number; profit: number }
  >();
  const customers = new Map<
    string,
    { name: string; orders: number; total: number }
  >();
  validOrders.forEach((order) => {
    const customerKey = order.customer?.id || "anonymous";
    const customer = customers.get(customerKey) || {
      name: order.customer?.name || "Consumidor não identificado",
      orders: 0,
      total: 0,
    };
    customer.orders += 1;
    customer.total += order.total;
    customers.set(customerKey, customer);
    order.items.forEach((item) => {
      const key = item.product?.sku || item.id;
      const product = products.get(key) || {
        name: item.product?.name || "Produto removido",
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      product.quantity += item.quantity;
      product.revenue += item.quantity * Number(item.unit_price);
      product.profit +=
        item.quantity *
        (Number(item.unit_price) - Number(item.product?.cost || 0));
      products.set(key, product);
    });
  });
  const productRanking = [...products.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );
  const customerRanking = [...customers.values()].sort(
    (a, b) => b.total - a.total,
  );
  const totalProductRevenue = productRanking.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  let cumulative = 0;
  const abc = productRanking.map((item) => {
    cumulative += item.revenue;
    const percentage = totalProductRevenue
      ? (cumulative / totalProductRevenue) * 100
      : 0;
    return {
      ...item,
      curve: percentage <= 80 ? "A" : percentage <= 95 ? "B" : "C",
    };
  });

  const months = Array.from({ length: Number(period) }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (Number(period) - 1 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString("pt-BR", { month: "short" }),
      value: transactions
        .filter((item) => item.type === "Entrada" && item.date.startsWith(key))
        .reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const maxMonth = Math.max(...months.map((month) => month.value), 1);

  const exportCsv = () => {
    const rows = [
      "Indicador,Valor",
      `Receita,${income}`,
      `Despesas,${expenses}`,
      `Lucro,${income - expenses}`,
      `Ticket médio,${ticket}`,
      "",
      "Produto,Quantidade,Receita,Lucro,Curva",
      ...abc.map(
        (item) =>
          `${item.name},${item.quantity},${item.revenue},${item.profit},${item.curve}`,
      ),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `relatorio-${owner}.csv`;
    link.click();
  };

  return (
    <div className="reportsPage">
      <div className="pageTitle">
        <div>
          <span className="eyebrow">INTELIGÊNCIA · v{APP_VERSION}</span>
          <h1>Relatórios</h1>
          <p>Indicadores calculados com os dados reais da operação.</p>
        </div>
        <div className="titleActions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
          </select>
          <button className="secondary" onClick={exportCsv}>
            <Download /> Exportar CSV
          </button>
        </div>
      </div>
      {error && <div className="dataError">{error}</div>}
      <section className="reportKpis">
        {[
          ["Receita", brl(income), TrendingUp],
          ["Despesas", brl(expenses), TrendingDown],
          ["Lucro", brl(income - expenses), BarChart3],
          ["Ticket médio", brl(ticket), ShoppingBag],
        ].map(([label, value, Icon]: any) => (
          <article key={label}>
            <Icon />
            <small>{label}</small>
            <b>{value}</b>
          </article>
        ))}
      </section>
      <section className="reportGrid">
        <div className="card reportChart">
          <h2>Comparação mensal</h2>
          <div className="reportBars">
            {months.map((month) => (
              <div key={month.key}>
                <span>
                  <i style={{ height: `${(month.value / maxMonth) * 100}%` }} />
                </span>
                <small>{month.label}</small>
                <b>{brl(month.value)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card reportSnapshot">
          <h2>Base comercial</h2>
          <div>
            <Package />
            <span>
              <b>{productCount}</b>
              <small>produtos</small>
            </span>
          </div>
          <div>
            <Users />
            <span>
              <b>{customerCount}</b>
              <small>clientes</small>
            </span>
          </div>
          <div>
            <ShoppingBag />
            <span>
              <b>{validOrders.length}</b>
              <small>pedidos no período</small>
            </span>
          </div>
        </div>
      </section>
      {owner === "giovanna" && (
        <section className="reportRankings">
          <div className="card">
            <h2>Produtos e curva ABC</h2>
            {abc.slice(0, 8).map((item, index) => (
              <div key={item.name}>
                <strong>{index + 1}</strong>
                <span>
                  <b>{item.name}</b>
                  <small>
                    {item.quantity} vendidos · lucro {brl(item.profit)}
                  </small>
                </span>
                <em className={`curve${item.curve}`}>{item.curve}</em>
                <b>{brl(item.revenue)}</b>
              </div>
            ))}
            {!abc.length && <p>Nenhuma venda no período.</p>}
          </div>
          <div className="card">
            <h2>Melhores clientes</h2>
            {customerRanking.slice(0, 8).map((item, index) => (
              <div key={`${item.name}-${index}`}>
                <strong>{index + 1}</strong>
                <span>
                  <b>{item.name}</b>
                  <small>{item.orders} pedido(s)</small>
                </span>
                <b>{brl(item.total)}</b>
              </div>
            ))}
            {!customerRanking.length && <p>Nenhuma compra no período.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
