import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const categoriasGasto = [
    'Alimentación',
    'Arriendo',
    'Gastos comunes',
    'Agua',
    'Luz',
    'Gas',
    'Transporte',
    'Salud',
    'Educación',
    'Compras',
    'Ahorro',
    'Otros',
  ]

  const categoriasIngreso = [
    'Sueldo',
    'Ingreso extra',
    'Venta',
    'Reembolso',
    'Otros',
  ]

  const [presupuesto, setPresupuesto] = useState(() => {
    return Number(localStorage.getItem('presupuesto')) || 0
  })

  const [movimientos, setMovimientos] = useState(() => {
    const guardados = localStorage.getItem('movimientos')
    return guardados ? JSON.parse(guardados) : []
  })

  const [tipo, setTipo] = useState('gasto')
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('Alimentación')
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    localStorage.setItem('presupuesto', presupuesto)
  }, [presupuesto])

  useEffect(() => {
    localStorage.setItem('movimientos', JSON.stringify(movimientos))
  }, [movimientos])

  const totalGastos = movimientos
    .filter((movimiento) => movimiento.tipo === 'gasto')
    .reduce((total, movimiento) => total + movimiento.monto, 0)

  const totalIngresos = movimientos
    .filter((movimiento) => movimiento.tipo === 'ingreso')
    .reduce((total, movimiento) => total + movimiento.monto, 0)

  const disponible = presupuesto + totalIngresos - totalGastos

  const porcentajeDisponible =
    presupuesto + totalIngresos > 0
      ? Math.max(
          0,
          Math.round(
            (disponible / (presupuesto + totalIngresos)) * 100
          )
        )
      : 0

  const gastosPorCategoria = categoriasGasto
    .map((nombreCategoria) => {
      const total = movimientos
        .filter(
          (movimiento) =>
            movimiento.tipo === 'gasto' &&
            movimiento.categoria === nombreCategoria
        )
        .reduce((suma, movimiento) => suma + movimiento.monto, 0)

      return {
        nombre: nombreCategoria,
        total,
        porcentaje:
          totalGastos > 0
            ? Math.round((total / totalGastos) * 100)
            : 0,
      }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  const formatoDinero = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(valor)

  const formatoFecha = (fechaMovimiento) => {
    if (!fechaMovimiento) return ''

    const [anio, mes, dia] = fechaMovimiento.split('-')
    return `${dia}/${mes}/${anio}`
  }

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo)

    if (nuevoTipo === 'gasto') {
      setCategoria('Alimentación')
    } else {
      setCategoria('Sueldo')
    }
  }

  const limpiarFormulario = () => {
    setNombre('')
    setMonto('')
    setEditandoId(null)
    setCategoria(tipo === 'gasto' ? 'Alimentación' : 'Sueldo')
    setFecha(new Date().toISOString().split('T')[0])
  }

  const guardarMovimiento = (e) => {
    e.preventDefault()

    if (!nombre.trim() || !monto || Number(monto) <= 0) {
      alert('Completa el nombre y escribe un monto válido.')
      return
    }

    if (editandoId !== null) {
      setMovimientos(
        movimientos.map((movimiento) =>
          movimiento.id === editandoId
            ? {
                ...movimiento,
                tipo,
                nombre: nombre.trim(),
                monto: Number(monto),
                categoria,
                fecha,
              }
            : movimiento
        )
      )

      limpiarFormulario()
      return
    }

    const nuevoMovimiento = {
      id: Date.now(),
      tipo,
      nombre: nombre.trim(),
      monto: Number(monto),
      categoria,
      fecha,
    }

    setMovimientos([nuevoMovimiento, ...movimientos])
    limpiarFormulario()
  }

  const editarMovimiento = (movimiento) => {
    setTipo(movimiento.tipo)
    setNombre(movimiento.nombre)
    setMonto(String(movimiento.monto))
    setCategoria(movimiento.categoria)
    setFecha(movimiento.fecha)
    setEditandoId(movimiento.id)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const cancelarEdicion = () => {
    limpiarFormulario()
  }

  const eliminarMovimiento = (id) => {
    setMovimientos(
      movimientos.filter((movimiento) => movimiento.id !== id)
    )

    if (editandoId === id) {
      limpiarFormulario()
    }
  }

  const categorias =
    tipo === 'gasto' ? categoriasGasto : categoriasIngreso

  return (
    <main className="app">
      <header className="encabezado">
        <div>
          <p className="etiqueta">MI HOGAR</p>
          <h1>Control de Finanzas del Hogar</h1>
          <p className="subtitulo">
            Organiza tu presupuesto y descubre en qué estás gastando.
          </p>
        </div>

        <div className="icono-hogar">🏠</div>
      </header>

      <section className="presupuesto">
        <label htmlFor="presupuesto">Presupuesto inicial</label>

        <div className="campo-presupuesto">
          <span>$</span>
          <input
            id="presupuesto"
            type="number"
            min="0"
            value={presupuesto || ''}
            onChange={(e) => setPresupuesto(Number(e.target.value))}
            placeholder="Ej: 1000000"
          />
        </div>
      </section>

      <section className="resumen">
        <article className="tarjeta">
          <span>💰 Disponible</span>
          <strong>{formatoDinero(disponible)}</strong>
        </article>

        <article className="tarjeta">
          <span>📈 Ingresos</span>
          <strong>{formatoDinero(totalIngresos)}</strong>
        </article>

        <article className="tarjeta">
          <span>📉 Gastos</span>
          <strong>{formatoDinero(totalGastos)}</strong>
        </article>
      </section>

      <section className="progreso">
        <div className="progreso-texto">
          <span>Dinero disponible</span>
          <strong>{porcentajeDisponible}%</strong>
        </div>

        <div className="barra">
          <div
            className="barra-interior"
            style={{
              width: `${Math.min(porcentajeDisponible, 100)}%`,
            }}
          />
        </div>
      </section>

      <section className="panel">
        <h2>¿En qué estás gastando?</h2>

        {gastosPorCategoria.length === 0 ? (
          <p className="sin-movimientos">
            Registra un gasto para ver el resumen por categoría.
          </p>
        ) : (
          <div className="categorias-resumen">
            {gastosPorCategoria.map((item) => (
              <div className="categoria-resumen" key={item.nombre}>
                <div className="categoria-texto">
                  <strong>{item.nombre}</strong>
                  <span>
                    {formatoDinero(item.total)} · {item.porcentaje}%
                  </span>
                </div>

                <div className="barra-categoria">
                  <div
                    className="barra-categoria-interior"
                    style={{
                      width: `${Math.min(item.porcentaje, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>
          {editandoId !== null
            ? 'Editar movimiento'
            : 'Agregar movimiento'}
        </h2>

        <div className="selector-tipo">
          <button
            type="button"
            className={tipo === 'gasto' ? 'activo' : ''}
            onClick={() => cambiarTipo('gasto')}
          >
            − Gasto
          </button>

          <button
            type="button"
            className={tipo === 'ingreso' ? 'activo' : ''}
            onClick={() => cambiarTipo('ingreso')}
          >
            + Ingreso
          </button>
        </div>

        <form onSubmit={guardarMovimiento}>
          <div className="formulario-grid">
            <label>
              Nombre
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Supermercado"
              />
            </label>

            <label>
              Monto
              <input
                type="number"
                min="1"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 25000"
              />
            </label>

            <label>
              Categoría
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categorias.map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </select>
            </label>

            <label>
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>
          </div>

          <button className="guardar" type="submit">
            {editandoId !== null
              ? 'Guardar cambios'
              : tipo === 'gasto'
                ? 'Guardar gasto'
                : 'Guardar ingreso'}
          </button>

          {editandoId !== null && (
            <button
              className="cancelar"
              type="button"
              onClick={cancelarEdicion}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </section>

      <section className="panel">
        <h2>Historial de movimientos</h2>

        {movimientos.length === 0 ? (
          <p className="sin-movimientos">
            Todavía no has registrado movimientos.
          </p>
        ) : (
          <div className="lista">
            {movimientos.map((movimiento) => (
              <article className="movimiento" key={movimiento.id}>
                <div className="movimiento-info">
                  <strong>{movimiento.nombre}</strong>
                  <span>
                    {movimiento.categoria} ·{' '}
                    {formatoFecha(movimiento.fecha)}
                  </span>
                </div>

                <div className="movimiento-derecha">
                  <strong
                    className={
                      movimiento.tipo === 'gasto'
                        ? 'cantidad gasto'
                        : 'cantidad ingreso'
                    }
                  >
                    {movimiento.tipo === 'gasto' ? '− ' : '+ '}
                    {formatoDinero(movimiento.monto)}
                  </strong>

                  <button
                    className="editar"
                    type="button"
                    onClick={() => editarMovimiento(movimiento)}
                    aria-label={`Editar ${movimiento.nombre}`}
                  >
                    ✏️
                  </button>

                  <button
                    className="eliminar"
                    type="button"
                    onClick={() => eliminarMovimiento(movimiento.id)}
                    aria-label={`Eliminar ${movimiento.nombre}`}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App