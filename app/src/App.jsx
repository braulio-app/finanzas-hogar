import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

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

const coloresGrafico = [
  '#28745b',
  '#3ba77b',
  '#6b9f8b',
  '#c69a55',
  '#7a8fb8',
  '#b36f6f',
  '#8b78ad',
  '#58a6a6',
  '#b18a5a',
  '#7f9d63',
  '#a86f8c',
  '#7d8b86',
]

function leerJSON(clave, respaldo) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : respaldo
  } catch {
    return respaldo
  }
}

function fechaLocal() {
  const ahora = new Date()

  const anio = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}

function mesActualReal() {
  return fechaLocal().slice(0, 7)
}

function moverMes(mes, cantidad) {
  const [anio, numeroMes] = mes.split('-').map(Number)

  const fecha = new Date(
    anio,
    numeroMes - 1 + cantidad,
    1
  )

  return `${fecha.getFullYear()}-${String(
    fecha.getMonth() + 1
  ).padStart(2, '0')}`
}

function ordenarMeses(lista) {
  return [...new Set(lista.filter(Boolean))].sort()
}

function completarMeses(lista) {
  const ordenados = ordenarMeses(lista)

  if (ordenados.length <= 1) {
    return ordenados
  }

  const resultado = []
  let actual = ordenados[0]
  const ultimo = ordenados.at(-1)

  while (actual <= ultimo) {
    resultado.push(actual)

    if (actual === ultimo) {
      break
    }

    actual = moverMes(actual, 1)
  }

  return resultado
}

function agregarMesesHasta(lista, objetivo) {
  const ordenados = ordenarMeses(lista)

  if (ordenados.length === 0) {
    return [objetivo]
  }

  const resultado = [...ordenados]
  let ultimo = resultado.at(-1)

  while (ultimo < objetivo) {
    ultimo = moverMes(ultimo, 1)
    resultado.push(ultimo)
  }

  return resultado
}

function generarCalendario(primerMes, cantidadMeses) {
  return Array.from(
    { length: cantidadMeses },
    (_, indice) => moverMes(primerMes, indice)
  )
}

function ultimoDiaDelMes(mes) {
  const [anio, numeroMes] = mes.split('-').map(Number)

  const dia = new Date(
    anio,
    numeroMes,
    0
  ).getDate()

  return `${mes}-${String(dia).padStart(2, '0')}`
}

function fechaParaMes(mes) {
  const hoy = fechaLocal()

  if (hoy.startsWith(mes)) {
    return hoy
  }

  return `${mes}-01`
}

function diferenciaMeses(desde, hasta) {
  const [anio1, mes1] = desde.split('-').map(Number)
  const [anio2, mes2] = hasta.split('-').map(Number)

  return (
    (anio2 - anio1) * 12 +
    (mes2 - mes1)
  )
}

function App() {
  const [modoOscuro, setModoOscuro] = useState(
    () =>
      localStorage.getItem('modoOscuro') === 'true'
  )

  const [movimientos, setMovimientos] = useState(
    () => leerJSON('movimientos', [])
  )

  const [meses, setMeses] = useState(() => {
    const nuevos = leerJSON(
      'finanzas_meses',
      null
    )

    if (
      Array.isArray(nuevos) &&
      nuevos.length > 0
    ) {
      return completarMeses(nuevos)
    }

    const mesesViejos = leerJSON(
      'meses',
      {}
    )

    const lista = [
      ...Object.keys(mesesViejos || {}),
      ...movimientos.map((movimiento) =>
        movimiento.fecha?.slice(0, 7)
      ),
    ]

    const encontrados = completarMeses(lista)

    if (encontrados.length > 0) {
      return encontrados
    }

    const presupuestoViejo =
      Number(
        localStorage.getItem('presupuesto')
      ) || 0

    return presupuestoViejo > 0
      ? [mesActualReal()]
      : []
  })

  const [
    saldoInicialBase,
    setSaldoInicialBase,
  ] = useState(() => {
    const nuevo = localStorage.getItem(
      'finanzas_saldo_inicial'
    )

    if (nuevo !== null) {
      return Number(nuevo) || 0
    }

    const mesesViejos = leerJSON(
      'meses',
      {}
    )

    const primerMes = ordenarMeses(
      Object.keys(mesesViejos || {})
    )[0]

    const valorViejo = primerMes
      ? Number(
          mesesViejos[primerMes]?.dineroInicial
        ) || 0
      : 0

    if (valorViejo > 0) {
      return valorViejo
    }

    return (
      Number(
        localStorage.getItem('presupuesto')
      ) || 0
    )
  })

  const mesesOrdenados = useMemo(
    () => ordenarMeses(meses),
    [meses]
  )

  const [
    mesSeleccionado,
    setMesSeleccionado,
  ] = useState(() => {
    const guardado =
      localStorage.getItem(
        'finanzas_mes_seleccionado'
      ) ||
      localStorage.getItem('mesSeleccionado')

    if (
      guardado &&
      guardado !== 'todos' &&
      meses.includes(guardado)
    ) {
      return guardado
    }

    return ordenarMeses(meses).at(-1) || ''
  })

  const [seccion, setSeccion] =
    useState('inicio')

  const [
    mostrarAyuda,
    setMostrarAyuda,
  ] = useState(false)

  const [
    mostrarNuevoMes,
    setMostrarNuevoMes,
  ] = useState(false)

  const [mesNuevo, setMesNuevo] =
    useState('')

  const [
    notificacionMes,
    setNotificacionMes,
  ] = useState(null)

  const [
    ultimoEliminado,
    setUltimoEliminado,
  ] = useState(null)

  const [mesInicio, setMesInicio] =
    useState(mesActualReal())

  const [
    dineroInicio,
    setDineroInicio,
  ] = useState('')

  const [
    metasPorMes,
    setMetasPorMes,
  ] = useState(() => {
    const nuevas = leerJSON(
      'finanzas_metas_por_mes',
      null
    )

    if (nuevas) {
      return nuevas
    }

    const vieja =
      Number(
        localStorage.getItem('metaAhorro')
      ) || 0

    return vieja > 0
      ? { __legacy__: vieja }
      : {}
  })

  const [
    limitesPorMes,
    setLimitesPorMes,
  ] = useState(() => {
    const nuevos = leerJSON(
      'finanzas_limites_por_mes',
      null
    )

    if (nuevos) {
      return nuevos
    }

    const viejos = leerJSON(
      'presupuestoCategorias',
      {}
    )

    return Object.keys(viejos).length > 0
      ? { __legacy__: viejos }
      : {}
  })

  const [tipo, setTipo] =
    useState('gasto')

  const [nombre, setNombre] =
    useState('')

  const [monto, setMonto] =
    useState('')

  const [
    categoria,
    setCategoria,
  ] = useState('Alimentación')

  const [fecha, setFecha] =
    useState(() =>
      mesSeleccionado
        ? fechaParaMes(mesSeleccionado)
        : fechaLocal()
    )

  const [
    editandoId,
    setEditandoId,
  ] = useState(null)

  const formularioRef = useRef(null)

  const calendario10Anos = useMemo(
    () =>
      generarCalendario(
        mesActualReal(),
        120
      ),
    []
  )

  const ultimoMesCalendario =
    calendario10Anos.at(-1)

  useEffect(() => {
    localStorage.setItem(
      'modoOscuro',
      modoOscuro
    )
  }, [modoOscuro])

  useEffect(() => {
    localStorage.setItem(
      'movimientos',
      JSON.stringify(movimientos)
    )
  }, [movimientos])

  useEffect(() => {
    localStorage.setItem(
      'finanzas_meses',
      JSON.stringify(mesesOrdenados)
    )
  }, [mesesOrdenados])

  useEffect(() => {
    localStorage.setItem(
      'finanzas_saldo_inicial',
      saldoInicialBase
    )
  }, [saldoInicialBase])

  useEffect(() => {
    if (mesSeleccionado) {
      localStorage.setItem(
        'finanzas_mes_seleccionado',
        mesSeleccionado
      )
    }
  }, [mesSeleccionado])

  useEffect(() => {
    localStorage.setItem(
      'finanzas_metas_por_mes',
      JSON.stringify(metasPorMes)
    )
  }, [metasPorMes])

  useEffect(() => {
    localStorage.setItem(
      'finanzas_limites_por_mes',
      JSON.stringify(limitesPorMes)
    )
  }, [limitesPorMes])

  useEffect(() => {
    if (!ultimoEliminado) {
      return undefined
    }

    const temporizador = setTimeout(
      () => {
        setUltimoEliminado(null)
      },
      6000
    )

    return () =>
      clearTimeout(temporizador)
  }, [ultimoEliminado])

  useEffect(() => {
    if (
      mesesOrdenados.length > 0 &&
      !mesesOrdenados.includes(
        mesSeleccionado
      )
    ) {
      setMesSeleccionado(
        mesesOrdenados.at(-1)
      )
    }
  }, [
    mesesOrdenados,
    mesSeleccionado,
  ])

  useEffect(() => {
    if (
      mesSeleccionado &&
      editandoId === null
    ) {
      setFecha(
        fechaParaMes(
          mesSeleccionado
        )
      )
    }
  }, [
    mesSeleccionado,
    editandoId,
  ])

  const datosMeses = useMemo(() => {
    const resultado = {}

    mesesOrdenados.forEach(
      (mes, indice) => {
        const movimientosMes =
          movimientos.filter(
            (movimiento) =>
              movimiento.fecha?.startsWith(
                mes
              )
          )

        const ingresos =
          movimientosMes
            .filter(
              (movimiento) =>
                movimiento.tipo === 'ingreso'
            )
            .reduce(
              (total, movimiento) =>
                total +
                Number(movimiento.monto),
              0
            )

        const gastos =
          movimientosMes
            .filter(
              (movimiento) =>
                movimiento.tipo === 'gasto'
            )
            .reduce(
              (total, movimiento) =>
                total +
                Number(movimiento.monto),
              0
            )

        const saldoInicial =
          indice === 0
            ? saldoInicialBase
            : resultado[
                mesesOrdenados[
                  indice - 1
                ]
              ].saldoFinal

        resultado[mes] = {
          saldoInicial,
          ingresos,
          gastos,
          diferencia:
            ingresos - gastos,
          saldoFinal:
            saldoInicial +
            ingresos -
            gastos,
        }
      }
    )

    return resultado
  }, [
    mesesOrdenados,
    movimientos,
    saldoInicialBase,
  ])

  const datosActuales =
    datosMeses[
      mesSeleccionado
    ] || {
      saldoInicial: 0,
      ingresos: 0,
      gastos: 0,
      diferencia: 0,
      saldoFinal: 0,
    }

  const indiceMes =
    mesesOrdenados.indexOf(
      mesSeleccionado
    )

  const mesAnterior =
    indiceMes > 0
      ? mesesOrdenados[
          indiceMes - 1
        ]
      : null

  const mesSiguiente =
    indiceMes >= 0 &&
    indiceMes <
      mesesOrdenados.length - 1
      ? mesesOrdenados[
          indiceMes + 1
        ]
      : null

  const movimientosMes =
    movimientos.filter(
      (movimiento) =>
        movimiento.fecha?.startsWith(
          mesSeleccionado
        )
    )

  const gastosPorCategoria =
    categoriasGasto
      .map(
        (nombreCategoria) => {
          const total =
            movimientosMes
              .filter(
                (movimiento) =>
                  movimiento.tipo ===
                    'gasto' &&
                  movimiento.categoria ===
                    nombreCategoria
              )
              .reduce(
                (suma, movimiento) =>
                  suma +
                  Number(
                    movimiento.monto
                  ),
                0
              )

          return {
            nombre:
              nombreCategoria,
            total,
            porcentaje:
              datosActuales.gastos > 0
                ? Math.round(
                    (total /
                      datosActuales.gastos) *
                      100
                  )
                : 0,
            porcentajeExacto:
              datosActuales.gastos > 0
                ? (total /
                    datosActuales.gastos) *
                  100
                : 0,
          }
        }
      )
      .filter(
        (item) =>
          item.total > 0
      )
      .sort(
        (a, b) =>
          b.total - a.total
      )

  const categoriaPrincipal =
    gastosPorCategoria[0] || null

  let acumuladoGrafico = 0

  const segmentosGrafico =
    gastosPorCategoria.map(
      (item, indice) => {
        const inicio =
          acumuladoGrafico

        acumuladoGrafico +=
          item.porcentajeExacto

        const final =
          acumuladoGrafico

        return `${
          coloresGrafico[
            indice %
              coloresGrafico.length
          ]
        } ${inicio}% ${final}%`
      }
    )

  const fondoGrafico =
    segmentosGrafico.length > 0
      ? `conic-gradient(${segmentosGrafico.join(
          ', '
        )})`
      : '#dce8e2'

  const mesesGrafico =
    mesesOrdenados.slice(-6)

  const mayorMovimientoGrafico =
    Math.max(
      1,
      ...mesesGrafico.flatMap(
        (mes) => [
          datosMeses[mes]?.ingresos || 0,
          datosMeses[mes]?.gastos || 0,
        ]
      )
    )

  const metaMes =
    Number(
      metasPorMes[
        mesSeleccionado
      ] ??
        metasPorMes.__legacy__
    ) || 0

  const limitesMes =
    limitesPorMes[
      mesSeleccionado
    ] ||
    limitesPorMes.__legacy__ ||
    {}

  const avanceMeta = Math.max(
    datosActuales.diferencia,
    0
  )

  const porcentajeMeta =
    metaMes > 0
      ? Math.min(
          Math.round(
            (avanceMeta /
              metaMes) *
              100
          ),
          100
        )
      : 0

  const formatoDinero = (valor) =>
    new Intl.NumberFormat(
      'es-CL',
      {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }
    ).format(
      Number(valor) || 0
    )

  const nombreDelMes = (mes) => {
    if (!mes) {
      return ''
    }

    const [anio, numeroMes] =
      mes.split('-').map(Number)

    const nombreMes = new Date(
      anio,
      numeroMes - 1,
      1
    ).toLocaleDateString(
      'es-CL',
      {
        month: 'long',
        year: 'numeric',
      }
    )

    return (
      nombreMes
        .charAt(0)
        .toUpperCase() +
      nombreMes.slice(1)
    )
  }

  const nombreMesCorto = (mes) => {
    if (!mes) {
      return ''
    }

    const [anio, numeroMes] =
      mes.split('-').map(Number)

    return new Date(
      anio,
      numeroMes - 1,
      1
    ).toLocaleDateString(
      'es-CL',
      {
        month: 'short',
      }
    )
  }

  const formatoFecha = (
    fechaMovimiento
  ) => {
    if (!fechaMovimiento) {
      return ''
    }

    const [anio, mes, dia] =
      fechaMovimiento.split('-')

    return `${dia}/${mes}/${anio}`
  }

  const obtenerSaldoHasta = (
    mesObjetivo
  ) => {
    const disponibles =
      mesesOrdenados.filter(
        (mes) =>
          mes <= mesObjetivo
      )

    const ultimo =
      disponibles.at(-1)

    return ultimo
      ? datosMeses[ultimo]
          ?.saldoFinal || 0
      : saldoInicialBase
  }

  useEffect(() => {
    if (
      mesesOrdenados.length === 0
    ) {
      return undefined
    }

    const comprobarCambioDeMes =
      () => {
        const mesReal =
          mesActualReal()

        const ultimoVisto =
          localStorage.getItem(
            'finanzas_ultimo_mes_real'
          )

        const ultimoRegistrado =
          mesesOrdenados.at(-1)

        if (
          mesReal >
          ultimoRegistrado
        ) {
          setMeses(
            (actuales) =>
              agregarMesesHasta(
                actuales,
                mesReal
              )
          )
        }

        if (!ultimoVisto) {
          localStorage.setItem(
            'finanzas_ultimo_mes_real',
            mesReal
          )

          if (
            mesReal >
            ultimoRegistrado
          ) {
            setMesSeleccionado(
              mesReal
            )

            setSeccion('inicio')
          }

          return
        }

        if (
          mesReal >
          ultimoVisto
        ) {
          const anteriorReal =
            moverMes(
              mesReal,
              -1
            )

          const saldoAnterior =
            obtenerSaldoHasta(
              anteriorReal
            )

          setNotificacionMes({
            mesNuevo: mesReal,
            mesAnterior:
              anteriorReal,
            saldoAnterior,
            mesesPasados:
              diferenciaMeses(
                ultimoVisto,
                mesReal
              ),
          })

          setMesSeleccionado(
            mesReal
          )

          setSeccion('inicio')

          localStorage.setItem(
            'finanzas_ultimo_mes_real',
            mesReal
          )
        }
      }

    comprobarCambioDeMes()

    const intervalo = setInterval(
      comprobarCambioDeMes,
      60000
    )

    return () =>
      clearInterval(intervalo)
  }, [
    mesesOrdenados,
    datosMeses,
    saldoInicialBase,
  ])

  const ultimoMesExistente =
    mesesOrdenados.at(-1) || ''

  const proximoMes =
    ultimoMesExistente
      ? moverMes(
          ultimoMesExistente,
          1
        )
      : mesActualReal()

  const opcionesMesNuevo =
    calendario10Anos.filter(
      (mes) =>
        !ultimoMesExistente ||
        mes >
          ultimoMesExistente
    )

  const iniciarAplicacion = (
    e
  ) => {
    e.preventDefault()

    if (!mesInicio) {
      alert(
        'Selecciona el mes con el que quieres comenzar.'
      )
      return
    }

    if (
      dineroInicio === '' ||
      Number(dineroInicio) < 0
    ) {
      alert(
        'Escribe cuánto dinero tienes disponible para comenzar.'
      )
      return
    }

    setMeses([mesInicio])

    setSaldoInicialBase(
      Number(dineroInicio)
    )

    setMesSeleccionado(
      mesInicio
    )

    setFecha(
      fechaParaMes(mesInicio)
    )

    localStorage.setItem(
      'finanzas_ultimo_mes_real',
      mesActualReal()
    )
  }

  const abrirNuevoMes = () => {
    if (
      opcionesMesNuevo.length ===
      0
    ) {
      alert(
        'Has llegado al límite del calendario actual de 10 años.'
      )
      return
    }

    setMesNuevo(
      opcionesMesNuevo.includes(
        proximoMes
      )
        ? proximoMes
        : opcionesMesNuevo[0]
    )

    setMostrarNuevoMes(true)
  }

  const crearNuevoMes = () => {
    if (!mesNuevo) {
      return
    }

    setMeses((actuales) =>
      agregarMesesHasta(
        actuales,
        mesNuevo
      )
    )

    setMesSeleccionado(
      mesNuevo
    )

    setMostrarNuevoMes(false)

    setSeccion('inicio')

    limpiarFormulario(mesNuevo)
  }

  const cambiarMes = (mes) => {
    setMesSeleccionado(mes)
    setEditandoId(null)
  }

  const cambiarTipo = (
    nuevoTipo
  ) => {
    setTipo(nuevoTipo)

    setCategoria(
      nuevoTipo === 'gasto'
        ? 'Alimentación'
        : 'Sueldo'
    )
  }

  const limpiarFormulario = (
    mes = mesSeleccionado
  ) => {
    setNombre('')
    setMonto('')
    setEditandoId(null)
    setTipo('gasto')
    setCategoria(
      'Alimentación'
    )

    if (mes) {
      setFecha(
        fechaParaMes(mes)
      )
    }
  }

  const irARegistrar = (
    tipoDeseado
  ) => {
    setSeccion('movimientos')

    cambiarTipo(tipoDeseado)

    setEditandoId(null)
    setNombre('')
    setMonto('')

    setFecha(
      fechaParaMes(
        mesSeleccionado
      )
    )

    setTimeout(() => {
      formularioRef.current?.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'start',
        }
      )
    }, 80)
  }

  const guardarMovimiento = (
    e
  ) => {
    e.preventDefault()

    if (
      !nombre.trim() ||
      !monto ||
      Number(monto) <= 0
    ) {
      alert(
        'Completa el nombre y escribe un monto válido.'
      )
      return
    }

    if (
      !fecha.startsWith(
        mesSeleccionado
      )
    ) {
      alert(
        'La fecha debe pertenecer al mes que estás viendo.'
      )
      return
    }

    if (
      editandoId !== null
    ) {
      setMovimientos(
        (actuales) =>
          actuales.map(
            (movimiento) =>
              movimiento.id ===
              editandoId
                ? {
                    ...movimiento,
                    tipo,
                    nombre:
                      nombre.trim(),
                    monto:
                      Number(monto),
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

    setMovimientos(
      (actuales) => [
        nuevoMovimiento,
        ...actuales,
      ]
    )

    limpiarFormulario()
  }

  const editarMovimiento = (
    movimiento
  ) => {
    setSeccion('movimientos')

    setTipo(
      movimiento.tipo
    )

    setNombre(
      movimiento.nombre
    )

    setMonto(
      String(
        movimiento.monto
      )
    )

    setCategoria(
      movimiento.categoria
    )

    setFecha(
      movimiento.fecha
    )

    setEditandoId(
      movimiento.id
    )

    setTimeout(() => {
      formularioRef.current?.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'start',
        }
      )
    }, 80)
  }

  const eliminarMovimiento = (
    movimiento
  ) => {
    const confirmar =
      window.confirm(
        `¿Eliminar "${movimiento.nombre}" por ${formatoDinero(
          movimiento.monto
        )}?`
      )

    if (!confirmar) {
      return
    }

    const indice =
      movimientos.findIndex(
        (item) =>
          item.id ===
          movimiento.id
      )

    setMovimientos(
      (actuales) =>
        actuales.filter(
          (item) =>
            item.id !==
            movimiento.id
        )
    )

    setUltimoEliminado({
      movimiento,
      indice,
    })

    if (
      editandoId ===
      movimiento.id
    ) {
      limpiarFormulario()
    }
  }

  const deshacerEliminacion =
    () => {
      if (!ultimoEliminado) {
        return
      }

      setMovimientos(
        (actuales) => {
          const copia = [
            ...actuales,
          ]

          const posicion =
            Math.min(
              Math.max(
                ultimoEliminado.indice,
                0
              ),
              copia.length
            )

          copia.splice(
            posicion,
            0,
            ultimoEliminado.movimiento
          )

          return copia
        }
      )

      setUltimoEliminado(null)
    }

  const actualizarLimite = (
    nombreCategoria,
    valor
  ) => {
    setLimitesPorMes(
      (actuales) => ({
        ...actuales,

        [mesSeleccionado]: {
          ...(
            actuales[
              mesSeleccionado
            ] ||
            actuales.__legacy__ ||
            {}
          ),

          [nombreCategoria]:
            Number(valor) || 0,
        },
      })
    )
  }

  const categorias =
    tipo === 'gasto'
      ? categoriasGasto
      : categoriasIngreso

  if (
    mesesOrdenados.length === 0
  ) {
    return (
      <div
        className={
          modoOscuro
            ? 'tema-oscuro'
            : 'tema-claro'
        }
      >
        <main className="app">
          <header className="encabezado">
            <div>
              <p className="etiqueta">
                MI HOGAR
              </p>

              <h1>
                Control de Finanzas del Hogar
              </h1>

              <p className="subtitulo">
                Tú registras lo que entra y lo que gastas.
                La aplicación hace los cálculos.
              </p>
            </div>

            <div className="icono-hogar">
              🏠
            </div>
          </header>

          <section className="panel bienvenida">
            <div className="bienvenida-icono">
              👋
            </div>

            <h2>
              Vamos a preparar tu primer mes
            </h2>

            <p className="subtitulo-panel">
              Solo necesitamos saber con qué mes comienzas
              y cuánto dinero tienes disponible.
            </p>

            <form
              onSubmit={
                iniciarAplicacion
              }
            >
              <div className="formulario-grid">
                <label>
                  Mes para comenzar

                  <input
                    type="month"
                    value={mesInicio}
                    max={
                      ultimoMesCalendario
                    }
                    onChange={(e) =>
                      setMesInicio(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Dinero disponible al comenzar

                  <input
                    type="number"
                    min="0"
                    value={dineroInicio}
                    onChange={(e) =>
                      setDineroInicio(
                        e.target.value
                      )
                    }
                    placeholder="Ej: 1000000"
                  />
                </label>
              </div>

              <p className="ayuda-campo">
                En los meses siguientes este monto se calculará
                automáticamente con lo que te haya quedado.
              </p>

              <button
                className="guardar"
                type="submit"
              >
                Comenzar
              </button>
            </form>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div
      className={
        modoOscuro
          ? 'tema-oscuro'
          : 'tema-claro'
      }
    >
      <main className="app">
        <header className="encabezado">
          <div>
            <p className="etiqueta">
              MI HOGAR
            </p>

            <h1>
              Control de Finanzas del Hogar
            </h1>

            <p className="subtitulo">
              Mira cuánto entra, cuánto gastas y cuánto te queda.
            </p>
          </div>

          <div className="icono-hogar">
            🏠
          </div>
        </header>

        <nav
          className="navegacion-principal"
          aria-label="Secciones de la aplicación"
        >
          <button
            type="button"
            className={
              seccion === 'inicio'
                ? 'activo'
                : ''
            }
            onClick={() =>
              setSeccion('inicio')
            }
          >
            🏠 Inicio
          </button>

          <button
            type="button"
            className={
              seccion ===
              'movimientos'
                ? 'activo'
                : ''
            }
            onClick={() =>
              setSeccion(
                'movimientos'
              )
            }
          >
            🧾 Movimientos
          </button>

          <button
            type="button"
            className={
              seccion ===
              'planificacion'
                ? 'activo'
                : ''
            }
            onClick={() =>
              setSeccion(
                'planificacion'
              )
            }
          >
            🎯 Planificación
          </button>

          <button
            type="button"
            className={
              seccion === 'mas'
                ? 'activo'
                : ''
            }
            onClick={() =>
              setSeccion('mas')
            }
          >
            ⚙️ Más
          </button>
        </nav>

        <section className="panel selector-mes-panel">
          <div className="selector-mes-cabecera">
            <div>
              <p className="etiqueta-seccion">
                MES QUE ESTÁS VIENDO
              </p>

              <h2>
                📅{' '}
                {nombreDelMes(
                  mesSeleccionado
                )}
              </h2>
            </div>

            <button
              type="button"
              className="boton-nuevo-mes"
              onClick={
                abrirNuevoMes
              }
            >
              ＋ Nuevo mes
            </button>
          </div>

          <div className="navegacion-meses">
            <button
              type="button"
              className="boton-mes"
              disabled={
                !mesAnterior
              }
              onClick={() =>
                mesAnterior &&
                cambiarMes(
                  mesAnterior
                )
              }
            >
              ‹
            </button>

            <select
              value={
                mesSeleccionado
              }
              onChange={(e) =>
                cambiarMes(
                  e.target.value
                )
              }
            >
              {mesesOrdenados.map(
                (mes) => (
                  <option
                    key={mes}
                    value={mes}
                  >
                    {nombreDelMes(
                      mes
                    )}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="boton-mes"
              disabled={
                !mesSiguiente
              }
              onClick={() =>
                mesSiguiente &&
                cambiarMes(
                  mesSiguiente
                )
              }
            >
              ›
            </button>
          </div>
        </section>

        {seccion === 'inicio' && (
          <>
            <section className="resumen resumen-cuatro">
              <article className="tarjeta">
                <span>
                  🏁 Comenzaste con
                </span>

                <strong>
                  {formatoDinero(
                    datosActuales.saldoInicial
                  )}
                </strong>
              </article>

              <article className="tarjeta">
                <span>
                  ➕ Entró este mes
                </span>

                <strong>
                  {formatoDinero(
                    datosActuales.ingresos
                  )}
                </strong>
              </article>

              <article className="tarjeta">
                <span>
                  ➖ Gastaste este mes
                </span>

                <strong>
                  {formatoDinero(
                    datosActuales.gastos
                  )}
                </strong>
              </article>

              <article className="tarjeta tarjeta-destacada">
                <span>
                  💵 Te queda
                </span>

                <strong>
                  {formatoDinero(
                    datosActuales.saldoFinal
                  )}
                </strong>
              </article>
            </section>

            <section className="panel mensaje-principal">
              {datosActuales.diferencia > 0 && (
                <p>
                  ✅ Este mes entró{' '}
                  <strong>
                    {formatoDinero(
                      datosActuales.diferencia
                    )}
                  </strong>{' '}
                  más de lo que gastaste.
                </p>
              )}

              {datosActuales.diferencia < 0 && (
                <p>
                  ℹ️ Este mes gastaste{' '}
                  <strong>
                    {formatoDinero(
                      Math.abs(
                        datosActuales.diferencia
                      )
                    )}
                  </strong>{' '}
                  más de lo que entró.
                </p>
              )}

              {datosActuales.diferencia === 0 && (
                <p>
                  ℹ️ Este mes lo que entró y lo que gastaste
                  está equilibrado.
                </p>
              )}
            </section>

            <section className="acciones-rapidas">
              <button
                type="button"
                className="accion-rapida gasto"
                onClick={() =>
                  irARegistrar(
                    'gasto'
                  )
                }
              >
                − Registrar gasto
              </button>

              <button
                type="button"
                className="accion-rapida ingreso"
                onClick={() =>
                  irARegistrar(
                    'ingreso'
                  )
                }
              >
                + Registrar ingreso
              </button>
            </section>

            <section className="panel">
              <h2>
                📊 Vista rápida del mes
              </h2>

              <div className="panel-graficos-inicio">
                <div className="grafico-circular-contenedor">
                  <div
                    className="grafico-circular"
                    style={{
                      background:
                        fondoGrafico,
                    }}
                  >
                    <div className="grafico-circular-centro">
                      <span>
                        Gastos
                      </span>

                      <strong>
                        {formatoDinero(
                          datosActuales.gastos
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="leyenda-grafico">
                  {gastosPorCategoria.length === 0 ? (
                    <p className="sin-datos-grafico">
                      Registra gastos para ver cómo se distribuyen.
                    </p>
                  ) : (
                    gastosPorCategoria
                      .slice(0, 6)
                      .map(
                        (item, indice) => (
                          <div
                            className="leyenda-item"
                            key={item.nombre}
                          >
                            <span
                              className="leyenda-color"
                              style={{
                                background:
                                  coloresGrafico[
                                    indice %
                                      coloresGrafico.length
                                  ],
                              }}
                            />

                            <div>
                              <strong>
                                {item.nombre}
                              </strong>

                              <span>
                                {item.porcentaje}% ·{' '}
                                {formatoDinero(
                                  item.total
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      )
                  )}
                </div>
              </div>
            </section>

            <section className="panel resumen-mes-texto">
              <h2>
                📌 Resumen sencillo del mes
              </h2>

              <div className="resumen-frases">
                <p>
                  Comenzaste con{' '}
                  <strong>
                    {formatoDinero(
                      datosActuales.saldoInicial
                    )}
                  </strong>
                  .
                </p>

                <p>
                  Entraron{' '}
                  <strong>
                    {formatoDinero(
                      datosActuales.ingresos
                    )}
                  </strong>{' '}
                  y gastaste{' '}
                  <strong>
                    {formatoDinero(
                      datosActuales.gastos
                    )}
                  </strong>
                  .
                </p>

                <p>
                  Ahora te quedan{' '}
                  <strong>
                    {formatoDinero(
                      datosActuales.saldoFinal
                    )}
                  </strong>
                  .
                </p>

                {categoriaPrincipal && (
                  <p>
                    Tu categoría con más gasto es{' '}
                    <strong>
                      {categoriaPrincipal.nombre}
                    </strong>{' '}
                    con{' '}
                    <strong>
                      {formatoDinero(
                        categoriaPrincipal.total
                      )}
                    </strong>
                    .
                  </p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-cabecera-simple">
                <h2>
                  🕘 Movimientos recientes
                </h2>

                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() =>
                    setSeccion(
                      'movimientos'
                    )
                  }
                >
                  Ver todos
                </button>
              </div>

              {movimientosMes.length === 0 ? (
                <p className="sin-movimientos">
                  Todavía no has registrado movimientos en este mes.
                </p>
              ) : (
                <div className="lista">
                  {movimientosMes
                    .slice(0, 3)
                    .map(
                      (movimiento) => (
                        <article
                          className="movimiento"
                          key={
                            movimiento.id
                          }
                        >
                          <div className="movimiento-info">
                            <strong>
                              {movimiento.nombre}
                            </strong>

                            <span>
                              {movimiento.categoria}{' '}
                              ·{' '}
                              {formatoFecha(
                                movimiento.fecha
                              )}
                            </span>
                          </div>

                          <strong
                            className={
                              movimiento.tipo ===
                              'gasto'
                                ? 'cantidad gasto'
                                : 'cantidad ingreso'
                            }
                          >
                            {movimiento.tipo ===
                            'gasto'
                              ? '− '
                              : '+ '}

                            {formatoDinero(
                              movimiento.monto
                            )}
                          </strong>
                        </article>
                      )
                    )}
                </div>
              )}
            </section>
          </>
        )}

        {seccion === 'movimientos' && (
          <>
            <section
              className="panel"
              ref={formularioRef}
            >
              <h2>
                {editandoId !== null
                  ? '✏️ Estás editando un movimiento'
                  : '➕ Registrar un movimiento'}
              </h2>

              <p className="subtitulo-panel">
                {editandoId !== null
                  ? 'Corrige lo que necesites y pulsa Guardar cambios.'
                  : 'Primero elige si el dinero salió o entró a tu hogar.'}
              </p>

              <div className="selector-tipo">
                <button
                  type="button"
                  className={
                    tipo === 'gasto'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    cambiarTipo(
                      'gasto'
                    )
                  }
                >
                  − Gasto
                </button>

                <button
                  type="button"
                  className={
                    tipo === 'ingreso'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    cambiarTipo(
                      'ingreso'
                    )
                  }
                >
                  + Ingreso
                </button>
              </div>

              <form
                onSubmit={
                  guardarMovimiento
                }
              >
                <div className="formulario-grid">
                  <label>
                    ¿Qué fue?

                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) =>
                        setNombre(
                          e.target.value
                        )
                      }
                      placeholder={
                        tipo === 'gasto'
                          ? 'Ej: Supermercado'
                          : 'Ej: Sueldo'
                      }
                    />
                  </label>

                  <label>
                    Monto

                    <input
                      type="number"
                      min="1"
                      value={monto}
                      onChange={(e) =>
                        setMonto(
                          e.target.value
                        )
                      }
                      placeholder="Ej: 25000"
                    />
                  </label>

                  <label>
                    Categoría

                    <select
                      value={categoria}
                      onChange={(e) =>
                        setCategoria(
                          e.target.value
                        )
                      }
                    >
                      {categorias.map(
                        (opcion) => (
                          <option
                            key={opcion}
                          >
                            {opcion}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Fecha

                    <input
                      type="date"
                      min={`${mesSeleccionado}-01`}
                      max={ultimoDiaDelMes(
                        mesSeleccionado
                      )}
                      value={fecha}
                      onChange={(e) =>
                        setFecha(
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <button
                  className="guardar"
                  type="submit"
                >
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
                    onClick={() =>
                      limpiarFormulario()
                    }
                  >
                    Cancelar edición
                  </button>
                )}
              </form>
            </section>

            <section className="panel">
              <h2>
                🧾 Movimientos de{' '}
                {nombreDelMes(
                  mesSeleccionado
                )}
              </h2>

              {movimientosMes.length === 0 ? (
                <p className="sin-movimientos">
                  Todavía no hay movimientos en este mes.
                </p>
              ) : (
                <div className="lista">
                  {movimientosMes.map(
                    (movimiento) => (
                      <article
                        className="movimiento"
                        key={
                          movimiento.id
                        }
                      >
                        <div className="movimiento-info">
                          <strong>
                            {movimiento.nombre}
                          </strong>

                          <span>
                            {movimiento.categoria}{' '}
                            ·{' '}
                            {formatoFecha(
                              movimiento.fecha
                            )}
                          </span>
                        </div>

                        <div className="movimiento-derecha">
                          <strong
                            className={
                              movimiento.tipo ===
                              'gasto'
                                ? 'cantidad gasto'
                                : 'cantidad ingreso'
                            }
                          >
                            {movimiento.tipo ===
                            'gasto'
                              ? '− '
                              : '+ '}

                            {formatoDinero(
                              movimiento.monto
                            )}
                          </strong>

                          <button
                            className="editar"
                            type="button"
                            onClick={() =>
                              editarMovimiento(
                                movimiento
                              )
                            }
                          >
                            ✏️
                          </button>

                          <button
                            className="eliminar"
                            type="button"
                            onClick={() =>
                              eliminarMovimiento(
                                movimiento
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {seccion === 'planificacion' && (
          <>
            <section className="panel">
              <h2>
                🎯 Meta para guardar este mes
              </h2>

              <p className="subtitulo-panel">
                Es opcional. Indica cuánto quieres que tus ingresos
                superen a tus gastos este mes.
              </p>

              <div className="campo-presupuesto">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  value={
                    metaMes || ''
                  }
                  onChange={(e) =>
                    setMetasPorMes(
                      (actuales) => ({
                        ...actuales,

                        [mesSeleccionado]:
                          Number(
                            e.target.value
                          ) || 0,
                      })
                    )
                  }
                  placeholder="Ej: 100000"
                />
              </div>

              {metaMes > 0 && (
                <div className="meta-ahorro">
                  <div className="progreso-texto">
                    <span>
                      Progreso
                    </span>

                    <strong>
                      {porcentajeMeta}%
                    </strong>
                  </div>

                  <div className="barra">
                    <div
                      className="barra-interior"
                      style={{
                        width: `${porcentajeMeta}%`,
                      }}
                    />
                  </div>

                  <p>
                    {avanceMeta > 0
                      ? `Hasta ahora tus ingresos superan tus gastos en ${formatoDinero(
                          avanceMeta
                        )}.`
                      : 'Por ahora tus gastos son iguales o mayores que tus ingresos.'}
                  </p>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>
                🚦 Límites de gasto
              </h2>

              <p className="subtitulo-panel">
                Opcional: decide cuánto quieres gastar como máximo
                en cada categoría durante este mes.
              </p>

              <div className="presupuestos-categorias">
                {categoriasGasto.map(
                  (nombreCategoria) => {
                    const gasto =
                      gastosPorCategoria.find(
                        (item) =>
                          item.nombre ===
                          nombreCategoria
                      )

                    const gastado =
                      gasto?.total || 0

                    const limite =
                      Number(
                        limitesMes[
                          nombreCategoria
                        ]
                      ) || 0

                    const porcentaje =
                      limite > 0
                        ? Math.round(
                            (gastado /
                              limite) *
                              100
                          )
                        : 0

                    return (
                      <div
                        className="presupuesto-categoria"
                        key={
                          nombreCategoria
                        }
                      >
                        <div className="categoria-cabecera">
                          <strong>
                            {nombreCategoria}
                          </strong>

                          <span>
                            {formatoDinero(
                              gastado
                            )}

                            {limite > 0 &&
                              ` de ${formatoDinero(
                                limite
                              )}`}
                          </span>
                        </div>

                        <input
                          type="number"
                          min="0"
                          value={
                            limitesMes[
                              nombreCategoria
                            ] || ''
                          }
                          onChange={(e) =>
                            actualizarLimite(
                              nombreCategoria,
                              e.target.value
                            )
                          }
                          placeholder="Escribe un límite"
                        />

                        {limite > 0 && (
                          <>
                            <div className="barra-categoria">
                              <div
                                className="barra-categoria-interior"
                                style={{
                                  width: `${Math.min(
                                    porcentaje,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                            {porcentaje >= 100 ? (
                              <p className="alerta-gasto alerta-roja">
                                🚨 Superaste este límite.
                              </p>
                            ) : porcentaje >= 80 ? (
                              <p className="alerta-gasto alerta-amarilla">
                                ⚠️ Estás cerca del límite.
                              </p>
                            ) : (
                              <p className="alerta-gasto alerta-verde">
                                ✓ Vas dentro del límite.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            </section>

            <section className="panel">
              <h2>
                📊 Gastos por categoría
              </h2>

              <div className="panel-graficos-planificacion">
                <div className="grafico-circular-contenedor">
                  <div
                    className="grafico-circular"
                    style={{
                      background:
                        fondoGrafico,
                    }}
                  >
                    <div className="grafico-circular-centro">
                      <span>
                        Total
                      </span>

                      <strong>
                        {formatoDinero(
                          datosActuales.gastos
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="categorias-resumen">
                  {gastosPorCategoria.length === 0 ? (
                    <p className="sin-movimientos">
                      Cuando registres gastos aparecerán aquí.
                    </p>
                  ) : (
                    gastosPorCategoria.map(
                      (item, indice) => (
                        <div
                          className="categoria-resumen"
                          key={item.nombre}
                        >
                          <div className="categoria-texto">
                            <strong>
                              <span
                                className="punto-categoria"
                                style={{
                                  background:
                                    coloresGrafico[
                                      indice %
                                        coloresGrafico.length
                                    ],
                                }}
                              />

                              {item.nombre}
                            </strong>

                            <span>
                              {formatoDinero(
                                item.total
                              )}{' '}
                              · {item.porcentaje}%
                            </span>
                          </div>

                          <div className="barra-categoria">
                            <div
                              className="barra-categoria-interior"
                              style={{
                                width: `${item.porcentaje}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="panel">
              <h2>
                📈 Evolución de los últimos meses
              </h2>

              <p className="subtitulo-panel">
                Compara visualmente cuánto entró y cuánto gastaste.
              </p>

              <div className="grafico-meses">
                {mesesGrafico.map(
                  (mes) => {
                    const datos =
                      datosMeses[mes]

                    const anchoIngresos =
                      Math.round(
                        (datos.ingresos /
                          mayorMovimientoGrafico) *
                          100
                      )

                    const anchoGastos =
                      Math.round(
                        (datos.gastos /
                          mayorMovimientoGrafico) *
                          100
                      )

                    return (
                      <div
                        className="fila-grafico-mes"
                        key={mes}
                      >
                        <div className="mes-grafico-nombre">
                          {nombreMesCorto(
                            mes
                          )}
                        </div>

                        <div className="barras-mes">
                          <div className="barra-mes-fila">
                            <span>
                              Entró
                            </span>

                            <div className="barra-mes-fondo">
                              <div
                                className="barra-mes-ingresos"
                                style={{
                                  width: `${anchoIngresos}%`,
                                }}
                              />
                            </div>

                            <strong>
                              {formatoDinero(
                                datos.ingresos
                              )}
                            </strong>
                          </div>

                          <div className="barra-mes-fila">
                            <span>
                              Gastó
                            </span>

                            <div className="barra-mes-fondo">
                              <div
                                className="barra-mes-gastos"
                                style={{
                                  width: `${anchoGastos}%`,
                                }}
                              />
                            </div>

                            <strong>
                              {formatoDinero(
                                datos.gastos
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </section>
          </>
        )}

        {seccion === 'mas' && (
          <>
            <section className="panel">
              <h2>
                ❓ Ayuda
              </h2>

              <p className="subtitulo-panel">
                Una guía sencilla para entender la aplicación.
              </p>

              <button
                type="button"
                className="guardar"
                onClick={() =>
                  setMostrarAyuda(
                    true
                  )
                }
              >
                Ver cómo usar la aplicación
              </button>
            </section>

            <section className="panel">
              <h2>
                🌙 Apariencia
              </h2>

              <p className="subtitulo-panel">
                El modo oscuro solo cambia el aspecto.
                Tus datos no cambian.
              </p>

              <button
                type="button"
                className="boton-secundario boton-grande"
                onClick={() =>
                  setModoOscuro(
                    (actual) =>
                      !actual
                  )
                }
              >
                {modoOscuro
                  ? '☀️ Usar modo claro'
                  : '🌙 Usar modo oscuro'}
              </button>
            </section>

            <section className="panel">
              <h2>
                📆 Calendario automático
              </h2>

              <p>
                La aplicación reconoce automáticamente los cambios
                de mes usando la fecha de tu dispositivo.
              </p>

              <p>
                Calendario disponible hasta{' '}
                <strong>
                  {nombreDelMes(
                    ultimoMesCalendario
                  )}
                </strong>
                .
              </p>
            </section>

            <section className="panel">
              <h2>
                🏁 Dinero del primer mes
              </h2>

              <p className="subtitulo-panel">
                Si te equivocaste al comenzar, puedes corregir aquí
                el dinero inicial. Los meses posteriores se recalcularán.
              </p>

              <div className="campo-presupuesto">
                <span>$</span>

                <input
                  type="number"
                  min="0"
                  value={
                    saldoInicialBase
                  }
                  onChange={(e) =>
                    setSaldoInicialBase(
                      Number(
                        e.target.value
                      ) || 0
                    )
                  }
                />
              </div>
            </section>

            <section className="panel aviso-datos">
              <h2>
                💾 Tus datos
              </h2>

              <p>
                Por ahora tus movimientos se guardan en este navegador.
                En una etapa posterior añadiremos respaldo,
                exportación y sincronización.
              </p>
            </section>
          </>
        )}
      </main>

      {mostrarNuevoMes && (
        <div className="modal-fondo">
          <div className="modal-ayuda">
            <button
              className="cerrar-ayuda"
              type="button"
              onClick={() =>
                setMostrarNuevoMes(
                  false
                )
              }
            >
              ✕
            </button>

            <h2>
              📅 Preparar otro mes
            </h2>

            <p>
              Esto es opcional. Cuando cambie el mes real,
              la aplicación también puede hacerlo automáticamente.
            </p>

            <label>
              Mes que quieres preparar

              <select
                value={mesNuevo}
                onChange={(e) =>
                  setMesNuevo(
                    e.target.value
                  )
                }
              >
                {opcionesMesNuevo.map(
                  (mes) => (
                    <option
                      key={mes}
                      value={mes}
                    >
                      {nombreDelMes(
                        mes
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            {mesNuevo && (
              <div className="nuevo-mes-resumen">
                <span>
                  Comenzará con el saldo que deje el mes anterior
                </span>

                <strong>
                  {formatoDinero(
                    datosMeses[
                      ultimoMesExistente
                    ]?.saldoFinal ||
                      saldoInicialBase
                  )}
                </strong>
              </div>
            )}

            <button
              className="guardar"
              type="button"
              onClick={
                crearNuevoMes
              }
            >
              Preparar{' '}
              {nombreDelMes(
                mesNuevo
              )}
            </button>

            <button
              className="cancelar"
              type="button"
              onClick={() =>
                setMostrarNuevoMes(
                  false
                )
              }
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {notificacionMes && (
        <div className="modal-fondo">
          <div className="modal-ayuda">
            <div className="bienvenida-icono">
              📅
            </div>

            <h2>
              ¡Comenzó{' '}
              {nombreDelMes(
                notificacionMes.mesNuevo
              )}
              !
            </h2>

            <p>
              {nombreDelMes(
                notificacionMes.mesAnterior
              )}{' '}
              terminó con:
            </p>

            <div className="nuevo-mes-resumen">
              <strong>
                {formatoDinero(
                  notificacionMes.saldoAnterior
                )}
              </strong>
            </div>

            <p>
              Ese mismo monto pasa automáticamente como dinero inicial
              del nuevo mes.
            </p>

            <button
              className="guardar"
              type="button"
              onClick={() =>
                setNotificacionMes(
                  null
                )
              }
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {mostrarAyuda && (
        <div className="modal-fondo">
          <div className="modal-ayuda modal-ayuda-grande">
            <button
              className="cerrar-ayuda"
              type="button"
              onClick={() =>
                setMostrarAyuda(
                  false
                )
              }
            >
              ✕
            </button>

            <h2>
              ❓ Cómo usar la aplicación
            </h2>

            <div className="instrucciones">
              <p>
                <strong>🏠 Inicio:</strong>{' '}
                mira rápidamente cuánto comenzaste,
                cuánto entró, cuánto gastaste y cuánto te queda.
              </p>

              <p>
                <strong>🧾 Movimientos:</strong>{' '}
                registra ingresos y gastos, o corrige movimientos anteriores.
              </p>

              <p>
                <strong>🎯 Planificación:</strong>{' '}
                consulta gráficos, define metas y establece límites de gasto.
              </p>

              <p>
                <strong>📅 Meses:</strong>{' '}
                usa las flechas o el selector para consultar otros meses.
              </p>

              <p>
                <strong>🔄 Cambio automático:</strong>{' '}
                cuando comience un nuevo mes, la aplicación trasladará
                automáticamente el dinero que quedó del mes anterior.
              </p>

              <p>
                <strong>✏️ Editar:</strong>{' '}
                toca el lápiz y la aplicación te llevará al formulario correcto.
              </p>

              <p>
                <strong>🗑️ Eliminar:</strong>{' '}
                antes de borrar un movimiento tendrás que confirmarlo.
                Después podrás usar Deshacer unos segundos.
              </p>
            </div>

            <p className="consejo-ayuda">
              💡 Tú registras lo que entra y sale.
              La aplicación organiza los meses y hace los cálculos.
            </p>
          </div>
        </div>
      )}

      {ultimoEliminado && (
        <div
          className="aviso-deshacer"
          role="status"
        >
          <span>
            Movimiento eliminado.
          </span>

          <button
            type="button"
            onClick={
              deshacerEliminacion
            }
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  )
}

export default App