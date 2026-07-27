import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  cancelIntegratedOrder,
  createCustomer,
  createIntegratedOrder,
  createProduct,
  CustomerRow,
  listCustomers,
  listOrders,
  listProducts,
  OrderRow,
  ProductRow,
  payIntegratedOrder,
  updateCustomer,
  updateProduct,
  uploadProductImage,
} from "./services/data";
import { APP_VERSION } from "./app-version";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CommercePage({
  page,
}: {
  page: "Estoque" | "Clientes" | "Pedidos";
}) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [expandedOrder, setExpandedOrder] = useState("");
  const [productDraft, setProductDraft] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    stock: "",
    low: "3",
    collection: "",
    image_url: "",
    reserved: "0",
    variation: "",
  });
  const [customerDraft, setCustomerDraft] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [orderDraft, setOrderDraft] = useState({
    customerId: "",
    payment: "PIX",
    status: "Pago" as "Pendente" | "Pago",
    items: [{ productId: "", quantity: "1" }],
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, customerData, orderData] = await Promise.all([
        listProducts("giovanna"),
        listCustomers("giovanna"),
        listOrders("giovanna"),
      ]);
      setProducts(productData);
      setCustomers(customerData);
      setOrders(orderData);
    } catch {
      setError(
        "Execute commerce-v1.1-migration.sql no Supabase para ativar este módulo.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      if (page === "Estoque") {
        if (!productDraft.name || !productDraft.sku) return;
        const payload = {
          name: productDraft.name,
          sku: productDraft.sku,
          price: Number(productDraft.price.replace(",", ".")),
          cost: Number(productDraft.cost.replace(",", ".")),
          stock: Number(productDraft.stock),
          low_stock_at: Number(productDraft.low),
          collection: productDraft.collection,
          image_url: productDraft.image_url,
          reserved: Number(productDraft.reserved),
          variation: productDraft.variation,
        };
        if (editId) await updateProduct(editId, payload);
        else await createProduct("giovanna", payload);
        setProductDraft({
          name: "",
          sku: "",
          price: "",
          cost: "",
          stock: "",
          low: "3",
          collection: "",
          image_url: "",
          reserved: "0",
          variation: "",
        });
      } else if (page === "Clientes") {
        if (!customerDraft.name) return;
        if (editId) await updateCustomer(editId, customerDraft);
        else await createCustomer("giovanna", customerDraft);
        setCustomerDraft({ name: "", phone: "", email: "", notes: "" });
      } else {
        const orderItems = orderDraft.items
          .filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({
            product_id: item.productId,
            quantity: Number(item.quantity),
          }));
        if (!orderItems.length) return;
        await createIntegratedOrder("giovanna", {
          customerId: orderDraft.customerId || null,
          payment: orderDraft.payment,
          status: orderDraft.status,
          items: orderItems,
        });
      }
      setOpen(false);
      setEditId("");
      await load();
    } catch (reason: any) {
      setError(reason?.message || "Não foi possível salvar.");
    }
  };

  const icon =
    page === "Estoque" ? Package : page === "Clientes" ? Users : ShoppingBag;
  const Icon = icon;
  const orderTotal = orderDraft.items.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    return sum + (product?.price || 0) * Number(line.quantity || 0);
  }, 0);
  const records = useMemo(() => {
    const normalized = query.toLowerCase();
    if (page === "Estoque")
      return products.filter((item) =>
        `${item.name} ${item.sku}`.toLowerCase().includes(normalized),
      );
    if (page === "Clientes")
      return customers.filter((item) =>
        `${item.name} ${item.email} ${item.phone}`
          .toLowerCase()
          .includes(normalized),
      );
    return orders.filter((item) =>
      `${item.order_number} ${item.customer?.name || ""} ${item.status}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [page, products, customers, orders, query]);

  return (
    <>
      <div className="pageTitle">
        <div>
          <span className="eyebrow">COMÉRCIO INTEGRADO · v{APP_VERSION}</span>
          <h1>{page}</h1>
          <p>
            {page === "Pedidos"
              ? "Venda conectada ao estoque, cliente e financeiro."
              : page === "Estoque"
                ? "Produtos, preços e disponibilidade em tempo real."
                : "Cadastro e relacionamento com seus clientes."}
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditId("");
            setOpen(true);
          }}
        >
          <Plus /> Novo {page === "Estoque" ? "produto" : page.slice(0, -1)}
        </button>
      </div>
      <section className="commerceSummary">
        <article>
          <Icon />
          <span>
            <b>{records.length}</b>
            <small>registros</small>
          </span>
        </article>
        {page === "Estoque" && (
          <article>
            <b>
              {
                products.filter((item) => item.stock <= item.low_stock_at)
                  .length
              }
            </b>
            <small>estoques baixos</small>
          </article>
        )}
        {page === "Pedidos" && (
          <article>
            <b>{brl(orders.reduce((sum, item) => sum + item.total, 0))}</b>
            <small>valor em pedidos</small>
          </article>
        )}
      </section>
      {error && (
        <div className="dataError" role="alert">
          {error}
        </div>
      )}
      <section className="card commerceCard">
        <div className="moduleSearch wide">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar em ${page.toLowerCase()}...`}
          />
        </div>
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : (
          <div className="commerceList">
            {records.map((record: any) => (
              <article key={record.id}>
                <i>
                  {page === "Estoque" && record.image_url ? (
                    <img src={record.image_url} alt="" />
                  ) : (
                    <Icon />
                  )}
                </i>
                <span>
                  <b>
                    {page === "Pedidos"
                      ? `Pedido #${record.order_number}`
                      : record.name}
                  </b>
                  <small>
                    {page === "Estoque"
                      ? `SKU ${record.sku} · ${record.stock} unidades`
                      : page === "Clientes"
                        ? record.email || record.phone || "Sem contato"
                        : `${record.customer?.name || "Consumidor"} · ${record.items.length} item(ns)`}
                  </small>
                  {page === "Clientes" && (
                    <small>
                      {
                        orders.filter(
                          (order) => order.customer?.id === record.id,
                        ).length
                      }{" "}
                      compra(s) ·{" "}
                      {brl(
                        orders
                          .filter(
                            (order) =>
                              order.customer?.id === record.id &&
                              order.status !== "Cancelado",
                          )
                          .reduce((sum, order) => sum + order.total, 0),
                      )}
                    </small>
                  )}
                </span>
                <strong>
                  {page === "Estoque"
                    ? brl(record.price)
                    : page === "Pedidos"
                      ? brl(record.total)
                      : ""}
                </strong>
                <em>
                  {page === "Estoque"
                    ? record.stock <= record.low_stock_at
                      ? "Estoque baixo"
                      : "Disponível"
                    : page === "Pedidos"
                      ? record.status
                      : "Cliente"}
                </em>
                {page !== "Pedidos" && (
                  <button
                    className="editCommerce"
                    aria-label={`Editar ${record.name}`}
                    onClick={() => {
                      setEditId(record.id);
                      if (page === "Estoque")
                        setProductDraft({
                          name: record.name,
                          sku: record.sku,
                          price: String(record.price),
                          cost: String(record.cost),
                          stock: String(record.stock),
                          low: String(record.low_stock_at),
                          collection: record.collection,
                          image_url: record.image_url,
                          reserved: String(record.reserved),
                          variation: record.variation,
                        });
                      else
                        setCustomerDraft({
                          name: record.name,
                          phone: record.phone,
                          email: record.email,
                          notes: record.notes,
                        });
                      setOpen(true);
                    }}
                  >
                    <Pencil /> Editar
                  </button>
                )}
                {page === "Pedidos" && (
                  <button
                    className="editCommerce"
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === record.id ? "" : record.id,
                      )
                    }
                  >
                    {expandedOrder === record.id ? "Ocultar" : "Detalhes"}
                  </button>
                )}
                {page === "Pedidos" && record.status === "Pendente" && (
                  <button
                    className="payOrder"
                    onClick={async () => {
                      try {
                        await payIntegratedOrder(record.id);
                        await load();
                      } catch (reason: any) {
                        setError(
                          reason?.message || "Não foi possível confirmar.",
                        );
                      }
                    }}
                  >
                    Confirmar pagamento
                  </button>
                )}
                {page === "Pedidos" && record.status !== "Cancelado" && (
                  <button
                    className="cancelOrder"
                    aria-label={`Cancelar pedido ${record.order_number}`}
                    onClick={async () => {
                      if (
                        !confirm(
                          "Cancelar este pedido? O estoque e o financeiro serão estornados.",
                        )
                      )
                        return;
                      try {
                        await cancelIntegratedOrder(record.id);
                        await load();
                      } catch {
                        setError("Não foi possível cancelar o pedido.");
                      }
                    }}
                  >
                    Cancelar
                  </button>
                )}
                {page === "Pedidos" && expandedOrder === record.id && (
                  <div className="orderDetails">
                    <b>Itens do pedido</b>
                    {record.items.map((item: any) => (
                      <span key={item.id}>
                        {item.quantity}× {item.product?.name || "Produto"}{" "}
                        <small>{brl(Number(item.unit_price))}</small>
                      </span>
                    ))}
                    <span>
                      Pagamento <small>{record.payment_method}</small>
                    </span>
                    <span>
                      Criado em{" "}
                      <small>
                        {new Date(record.created_at).toLocaleString("pt-BR")}
                      </small>
                    </span>
                  </div>
                )}
              </article>
            ))}
            {!records.length && (
              <div className="empty">
                <Icon />
                <b>Nenhum registro encontrado</b>
                <span>
                  Use o botão acima para realizar o primeiro cadastro.
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <AnimatePresence>
        {open && (
          <div className="modalBg" onClick={() => setOpen(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button className="close" onClick={() => setOpen(false)}>
                <X />
              </button>
              <span className="eyebrow">NEXO ERP · v{APP_VERSION}</span>
              <h2>
                {editId ? "Editar" : "Novo"}{" "}
                {page === "Estoque" ? "produto" : page.slice(0, -1)}
              </h2>
              {page === "Estoque" ? (
                <>
                  <label>
                    Nome
                    <input
                      autoFocus
                      value={productDraft.name}
                      onChange={(e) =>
                        setProductDraft({
                          ...productDraft,
                          name: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="formRow">
                    <label>
                      SKU
                      <input
                        value={productDraft.sku}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            sku: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Estoque inicial
                      <input
                        type="number"
                        min="0"
                        value={productDraft.stock}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            stock: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="formRow">
                    <label>
                      Coleção
                      <input
                        value={productDraft.collection}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            collection: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Variação
                      <input
                        value={productDraft.variation}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            variation: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="formRow">
                    <label>
                      Reservadas
                      <input
                        type="number"
                        min="0"
                        value={productDraft.reserved}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            reserved: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Foto do produto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            const image_url = await uploadProductImage(file);
                            setProductDraft({ ...productDraft, image_url });
                          } catch {
                            setError("Não foi possível enviar a foto.");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="formRow">
                    <label>
                      Preço
                      <input
                        inputMode="decimal"
                        value={productDraft.price}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            price: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Custo
                      <input
                        inputMode="decimal"
                        value={productDraft.cost}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            cost: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </>
              ) : page === "Clientes" ? (
                <>
                  <label>
                    Nome
                    <input
                      autoFocus
                      value={customerDraft.name}
                      onChange={(e) =>
                        setCustomerDraft({
                          ...customerDraft,
                          name: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="formRow">
                    <label>
                      Telefone
                      <input
                        value={customerDraft.phone}
                        onChange={(e) =>
                          setCustomerDraft({
                            ...customerDraft,
                            phone: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      E-mail
                      <input
                        type="email"
                        value={customerDraft.email}
                        onChange={(e) =>
                          setCustomerDraft({
                            ...customerDraft,
                            email: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Cliente
                    <select
                      value={orderDraft.customerId}
                      onChange={(e) =>
                        setOrderDraft({
                          ...orderDraft,
                          customerId: e.target.value,
                        })
                      }
                    >
                      <option value="">Consumidor não identificado</option>
                      {customers.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="cartBuilder">
                    <label>Produtos do pedido</label>
                    {orderDraft.items.map((line, index) => (
                      <div className="cartLine" key={index}>
                        <select
                          value={line.productId}
                          onChange={(event) =>
                            setOrderDraft({
                              ...orderDraft,
                              items: orderDraft.items.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, productId: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        >
                          <option value="">Selecione um produto</option>
                          {products.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name} · {item.stock} disponíveis
                            </option>
                          ))}
                        </select>
                        <input
                          aria-label="Quantidade"
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(event) =>
                            setOrderDraft({
                              ...orderDraft,
                              items: orderDraft.items.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, quantity: event.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        {orderDraft.items.length > 1 && (
                          <button
                            aria-label="Remover produto"
                            onClick={() =>
                              setOrderDraft({
                                ...orderDraft,
                                items: orderDraft.items.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                          >
                            <Trash2 />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="addCartLine"
                      onClick={() =>
                        setOrderDraft({
                          ...orderDraft,
                          items: [
                            ...orderDraft.items,
                            { productId: "", quantity: "1" },
                          ],
                        })
                      }
                    >
                      <Plus /> Adicionar outro produto
                    </button>
                    <div className="cartTotal">
                      <span>Total do pedido</span>
                      <b>{brl(orderTotal)}</b>
                    </div>
                  </div>
                  <div className="formRow">
                    <label>
                      Pagamento
                      <select
                        value={orderDraft.payment}
                        onChange={(e) =>
                          setOrderDraft({
                            ...orderDraft,
                            payment: e.target.value,
                          })
                        }
                      >
                        <option>PIX</option>
                        <option>Cartão</option>
                        <option>Dinheiro</option>
                      </select>
                    </label>
                    <label>
                      Situação
                      <select
                        value={orderDraft.status}
                        onChange={(e) =>
                          setOrderDraft({
                            ...orderDraft,
                            status: e.target.value as "Pendente" | "Pago",
                          })
                        }
                      >
                        <option>Pago</option>
                        <option>Pendente</option>
                      </select>
                    </label>
                  </div>
                </>
              )}
              <button className="primary full" onClick={() => void save()}>
                Salvar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
