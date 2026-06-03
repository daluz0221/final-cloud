import { useCallback, useEffect, useState } from "react";
import { listar, crear, actualizar, eliminar } from "./api/products";
import "./App.css";

const FORM_VACIO = { nombre: "", categoria: "", cantidad: "" };

function App() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | "new" | producto
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listar();
      setProductos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error al cargar productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setFormError(null);
    setModal("new");
  }

  function abrirEditar(p) {
    setForm({
      nombre: p.nombre ?? "",
      categoria: p.categoria ?? "",
      cantidad: String(p.cantidad ?? 0),
    });
    setFormError(null);
    setModal(p);
  }

  function cerrarModal() {
    if (guardando) return;
    setModal(null);
    setFormError(null);
  }

  function onChangeForm(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function bodyDesdeForm(esEdicion) {
    const nombre = form.nombre.trim();
    if (!nombre) throw new Error("El nombre es obligatorio");

    const body = { nombre };

    const cat = form.categoria.trim();
    if (cat) body.categoria = cat;
    else if (!esEdicion) {
      // crear: la API pone "General" si no envías categoria
    } else if (esEdicion && modal?.categoria) {
      body.categoria = modal.categoria;
    }

    const cantStr = form.cantidad.trim();
    if (cantStr !== "") {
      const cantidad = Number(cantStr);
      if (!Number.isInteger(cantidad) || cantidad < 0) {
        throw new Error("Cantidad debe ser un entero ≥ 0");
      }
      body.cantidad = cantidad;
    } else if (esEdicion) {
      body.cantidad = modal.cantidad ?? 0;
    }

    return body;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setGuardando(true);
    try {
      const esEdicion = modal !== "new" && modal?.id;
      const body = bodyDesdeForm(Boolean(esEdicion));

      if (esEdicion) {
        await actualizar(modal.id, body);
      } else {
        await crear(body);
      }
      cerrarModal();
      setModal(null);
      await cargar();
    } catch (err) {
      setFormError(err.message || "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function onEliminar(p) {
    const ok = confirm(`¿Eliminar "${p.nombre}"?`);
    if (!ok) return;
    setError(null);
    try {
      await eliminar(p.id);
      await cargar();
    } catch (e) {
      setError(e.message || "No se pudo eliminar");
    }
  }

  const tituloModal =
    modal === "new" ? "Nuevo producto" : modal ? "Editar producto" : "";

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-kicker">Inventario cloud</p>
          <h1>Productos</h1>
          <p className="app-sub">CRUD sobre API Gateway + DynamoDB</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo producto
        </button>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="panel">
        {loading ? (
          <div className="state state-loading">
            <span className="spinner" aria-hidden="true" />
            <p>Cargando productos…</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="state state-empty">
            <p>No hay productos</p>
            <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Nombre">
                      <strong>{p.nombre}</strong>
                    </td>
                    <td data-label="Categoría">
                      <span className="badge">{p.categoria ?? "General"}</span>
                    </td>
                    <td data-label="Cantidad">{p.cantidad ?? 0}</td>
                    <td data-label="Acciones" className="actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => abrirEditar(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => onEliminar(p)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2 id="modal-title">{tituloModal}</h2>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>

            <form className="form" onSubmit={onSubmit}>
              {formError && (
                <div className="alert alert-error">{formError}</div>
              )}

              <label>
                Nombre <span className="req">*</span>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChangeForm}
                  required
                  autoFocus
                  placeholder="Ej. Teclado mecánico"
                />
              </label>

              <label>
                Categoría
                <input
                  name="categoria"
                  value={form.categoria}
                  onChange={onChangeForm}
                  placeholder="Vacío → General (solo al crear)"
                />
              </label>

              <label>
                Cantidad
                <input
                  name="cantidad"
                  type="number"
                  min="0"
                  step="1"
                  value={form.cantidad}
                  onChange={onChangeForm}
                  placeholder="0"
                />
              </label>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;