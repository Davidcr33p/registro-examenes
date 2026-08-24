// Re-etiqueta el catálogo de academias: cambia `materias` de un arreglo de
// strings a un arreglo de objetos { nombre, semestre } (1-6), usando el plan
// de estudios de la Preparatoria Álvaro Obregón — UANL, Unidad Monterrey I.
//
// Uso: node scripts/retag-semestres.mjs
// Requiere Node 18+. No necesita credenciales (academias/ es de
// lectura/escritura abierta, ver firestore.rules).

const PROJECT_ID = "registro-examenes-eiao";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// nombre de la academia -> { semestre: [materias] }
const plan = {
  "Técnico en Administrador Contable": {
    1: ["Introducción a la Contabilidad", "Derecho Mercantil"],
    2: ["Contabilidad I", "Cálculo Mercantil", "Hoja de Cálculo"],
    3: ["Contabilidad II", "Administración Empresarial", "Sistemas de Aplicación Contable", "Base de Datos en Contabilidad"],
    4: ["Sistema Financiero Mexicano", "Nóminas Electrónicas Integrales", "Contabilidad de Sociedades", "Inglés para Negocios I"],
    5: ["Costos", "Derecho Fiscal"],
    6: ["Introducción a las Finanzas", "Principios de Microeconomía", "Introducción a los Impuestos", "Inglés para Negocios II", "Recursos Humanos"]
  },
  "Técnico en Aire Acondicionado y Refrigeración": {
    1: ["Sistema de Unidades para Refrigeración", "Soldadura Elemental"],
    2: ["Dibujo Elemental", "Electricidad para Refrigeración", "Refrigeración Elemental"],
    3: ["Electrónica Elemental para Aire Acondicionado y Refrigeración", "Refrigeración Doméstica y Comercial", "Soldaduras Especiales para Aire Acondicionado y Refrigeración"],
    4: ["Calderas", "Electricidad para Aire Acondicionado y Refrigeración", "Aire Acondicionado Minisplit e Inverter"],
    5: ["Sistemas de Refrigeración para Transporte Comercial", "Electricidad para Unidades Centrales y Cuartos Fríos", "Electrónica de Control", "Cuartos Fríos"],
    6: ["Control Lógico Programable para Refrigeración y Aire Acondicionado", "Aire Acondicionado Central", "Tratamientos Térmicos y Termodinámica de Gases", "Aire Acondicionado para Vehículos"]
  },
  "Técnico en Aplicaciones Audiovisuales": {
    1: ["Ilustración Digital Básica", "Historia y Fundamentos del Diseño Gráfico"],
    2: ["Diseño y Edición Digital", "Tipografía", "Representaciones Creativas"],
    3: ["Fotografía Básica", "Diseño de Páginas Web", "Publicidad y Creatividad", "Medios Digitales", "Diseño Editorial", "Técnicas de Impresión"],
    4: ["Diseño Tridimensional", "Diseño de Empaques y Maquetas para Mercadotecnia"],
    5: ["Ilustración Digital Avanzada", "Animación Multimedia", "Edición de Medios Digitales"],
    6: ["Identidad Corporativa", "Gráficos Digitales en Movimiento", "Taller Integral", "Diseño de Material Didáctico"]
  },
  "Técnico en Biotecnología Industrial": {
    1: ["Bioseguridad y Material de Laboratorio", "Introducción a la Biotecnología"],
    2: ["Introducción a las Técnicas Analíticas", "Introducción a la Microbiología"],
    3: ["Técnicas Analíticas de Laboratorio", "Química de los Compuestos Orgánicos", "Tópicos de Química", "Metodologías de Laboratorio", "Microbiología Analítica"],
    4: ["Fundamentos de Bioquímica", "Análisis de Aguas"],
    5: ["Biología Celular", "Introducción a los Procesos de Fermentación", "Microbiología de Alimentos"],
    6: ["Taller de Productos Químicos", "Técnicas de Análisis de Alimentos"]
  },
  "Técnico en Dibujante Industrial": {
    1: ["Medición e Interpretación de Planos", "Dibujo Básico"],
    2: ["Dibujo Mecánico", "Herramientas de Dibujo"],
    3: ["Procesos de Máquinas", "Dibujo de Modelos Mecánicos para Ensamble", "Bocetos y Dibujo Artístico", "Retoque y Diseño de Modelos", "Elementos Mecánicos"],
    4: ["Dibujo de Detalle", "Procesos de Impresión"],
    5: ["Dibujos Especializados", "Dibujo de Sólidos", "Modelado en 3D"],
    6: ["Modelado Virtual de Proyectos", "Dibujo e Interpretación de Planos Arquitectónicos"]
  },
  "Técnico en Electricista": {
    1: ["Instrumentación y Medición de las Magnitudes Eléctricas"],
    2: ["Dibujo Eléctrico Industrial", "Electricidad y Magnetismo", "Reparación de Motores Eléctricos", "Instalaciones Eléctricas Residenciales"],
    3: ["Diseño de Circuitos Asistido por Computadora", "Circuitos Eléctricos", "Funcionamiento de Motores y Generadores"],
    4: ["Mantenimiento en Sistemas de Energía Fotovoltaica", "Funcionamiento de Transformadores Eléctricos", "Sensores y Accionamientos Eléctricos", "Control Eléctrico de Motores"],
    5: ["Instalación Eléctrica de Minisplits", "Fundamentos de Electrónica de Potencia", "Mantenimiento en Sistemas de Iluminación y Energía Renovable", "Sistemas Digitales"],
    6: ["Sistemas Domóticos", "Mantenimiento de Subestaciones Eléctricas", "Instalación y Operación de los Sistemas de Control", "Internet de las Cosas"]
  },
  "Técnico en Electromecánico Industrial": {
    1: ["Instrumentación para Electromecánicos", "Mantenimiento Productivo Total"],
    2: ["Dibujo Básico para Electromecánicos", "Electricidad para Electromecánicos", "Elementos y Herramientas en Electromecánica", "Tecnología de Materiales"],
    3: ["Mantenimiento a Motores Eléctricos", "Diagnóstico de Fallas en Elementos Mecánicos", "Soldadura Básica para Electromecánicos", "Dibujo Electromecánico"],
    4: ["Circuitos Eléctricos y Electrónicos de Potencia", "Electroneumática e Hidráulica Industrial", "Refrigeración y Aire Acondicionado"],
    5: ["Control Lógico Programable para Mecánico Eléctrico", "Principios de Taladrado y Torneado Convencional", "Transformadores y Subestaciones", "Mantenimiento a Máquinas de Soldar para Electromecánicos"],
    6: ["Fresado y Rectificado", "Proyecto de Sistemas Electromecánicos", "Soldaduras Especiales", "Mantenimiento Electromecánico"]
  },
  "Técnico en Electromovilidad": {
    1: ["Electrotecnia en Electromovilidad", "Introducción a la Mecánica Automotriz", "Interpretación de Diagramas Eléctrico-Electrónicos"],
    2: ["Reparación de Motores de Combustión Interna", "Electricidad y Electrónica de Potencia", "Diseño de Circuitos de Corriente Alterna y de Corriente Directa", "Afinación de Motores de Combustión Interna"],
    3: ["Autotrónica en Electromovilidad", "Motores y Generadores para Vehículos", "Ajustes Técnicos y Soldadura", "Sistemas Híbridos de Combustión"],
    4: ["Gestión del Taller de Servicio Automotriz", "Automóviles Híbridos y Eléctricos", "Sistemas de Enfriamiento para Vehículos Híbridos y Eléctricos"],
    5: ["Sistema de Navegación Inteligente", "Sistema Eléctrico para Vehículos", "Tren de Potencia en Vehículos con Fuente Eléctrica"],
    6: ["Sistemas Híbridos y Eléctricos en el Servicio Pesado", "Manejo de Sistemas de Alto Voltaje en Vehículos Híbridos y Eléctricos", "Electrosistemas de Suspensión y Frenos"]
  },
  "Técnico en Electrónica Industrial": {
    1: ["Diseño Asistido por Computadora para Electrónica", "Electrónica Digital"],
    2: ["Circuitos de Corriente Directa y Corriente Alterna para Electrónica", "Introducción al Taller de Electrónica", "Fundamentos de las Telecomunicaciones y Conexión de Equipos", "Introducción a la Programación para Microcontroladores"],
    3: ["Temas Selectos de Electrónica", "Automatización", "Interpretación de Planos Electrónicos", "Sistemas Digitales Programables", "Circuitos Integrados Programables"],
    4: ["Mantenimiento Industrial", "Aplicaciones Industriales de Control Lógico Programable", "Elementos de Control de Potencia"],
    5: ["Control Lógico Programable", "Control de Motores de Corriente Directa y Corriente Alterna para Electrónica", "Electrónica Embarcada"],
    6: ["Arquitectura y Programación de Robots", "Domótica", "Proyecto Electrónico"]
  },
  "Técnico en Energías Renovables": {
    1: ["Instrumentos de Medición", "Introducción a las Energías Renovables"],
    2: ["Soldadura Básica para Energías Renovables", "Prevención de Riesgos Eléctricos", "Medio Ambiente y Sostenibilidad"],
    3: ["Circuitos Eléctricos Electrónicos", "Gestión Eficiente de Energías en Edificaciones", "Uso Eficiente de Energía", "Manejo de Residuos", "Inglés para Energías Renovables"],
    4: ["Técnicas de Instalaciones Eléctricas", "Circuitos de Inducción", "Acumuladores, Controladores e Inversores"],
    5: ["Domótica e Iluminación", "Motores y Generadores Eléctricos", "Elementos y Dispositivos Electromecánicos", "Energía Fotovoltaica", "Proyecto Energético"],
    6: ["Energía Eólica", "Automatización y Control Industrial", "Energía Solar Térmica", "Diseño por Computadora en las Energías Renovables", "Normatividad"]
  },
  "Técnico en Inteligencia Artificial": {
    1: ["Introducción a la Programación", "Infraestructura e Informática en la Nube", "Introducción a la Inteligencia Artificial"],
    2: ["Paradigmas de la Programación", "Análisis de Algoritmos", "Visualización de Datos", "Principios de Electrónica"],
    3: ["Diseño de Interfaces Web", "Diseño de Bases de Datos", "Dispositivos Electrónicos", "Preprocesamiento de Imágenes"],
    4: ["Patrones de Diseño Web", "Desarrollo de Aplicaciones Móviles", "Visión Computacional"],
    5: ["Aplicaciones Multiplataforma", "Aprendizaje Supervisado", "Algoritmo Bio Inspirador", "Comunicación Integral en Inglés Técnico I"],
    6: ["Gestión de Proyectos con Tecnologías de Información", "Aprendizaje No Supervisado", "Redes Neuronales y Aprendizaje Profundo", "Proyectos de Aprendizaje Automático", "Aplicaciones de la Inteligencia Artificial", "Comunicación Integral en Inglés Técnico II"]
  },
  "Técnico en Máquinas-Herramientas Industriales": {
    1: ["Metrología y Ajustes para Máquinas-Herramientas Industriales"],
    2: ["Dibujo Básico para Máquinas-Herramientas Industriales", "Fundamentos de Torneado Convencional", "Soldadura Eléctrica"],
    3: ["Interpretación de Planos Mecánicos", "Maquinado de Roscas en Torno Convencional", "Dibujo Auxiliado por Computadora", "Mantenimiento Productivo Total"],
    4: ["Diseño de Elementos Mecánicos", "Fundamentos de Fresado Convencional", "Fundamentos de Torneado con Control Numérico Computarizado"],
    5: ["Temas Selectos de Automatización", "Maquinado de Precisión en Torno Convencional", "Fundamentos de Fresado con Control Numérico Computarizado", "Mecánica de Materiales", "Procesos de Manufactura"],
    6: ["Maquinado Auxiliado por Computadora", "Procesos de Torneado con Control Numérico Computarizado", "Proyecto de Máquinas Industriales"]
  },
  "Técnico en Mecánica Automotriz y Autotrónica": {
    1: ["Introducción al Taller Automotriz"],
    2: ["Sistema Eléctrico del Automóvil", "Afinación de Motores"],
    3: ["Autotrónica I", "Reparación de Motores a Gasolina", "Reparación de Carrocería"],
    4: ["Soluciones Técnicas y Soldadura", "Mantenimiento Motores Diesel", "Sistemas de Aire Acondicionado Automotriz"],
    5: ["Motores de Equipo y Vehículos Ligeros", "Reparación y Ajuste de Motores Diesel", "Tren Motriz"],
    6: ["Administración del Taller de Servicio Automotriz", "Autotrónica II", "Sistemas Electrónicos Diesel", "Automóviles Híbridos y Eléctricos", "Sistemas de Suspensión y Frenos"]
  },
  "Técnico en Mecatrónica Industrial": {
    1: ["Introducción a la Mecatrónica", "Principios de Electricidad"],
    2: ["Sensórica", "Electrónica Analógica", "Circuitos Lógicos Digitales", "Procesos de Medición y Ajustes"],
    3: ["Potencia Fluida", "Técnicas de Instalaciones Eléctricas", "Electrónica de Potencia", "Motores Eléctricos", "Dibujo para Mecatrónica"],
    4: ["Mecánica de Concepción", "Automatización con Control Lógico Programable", "Microcontroladores"],
    5: ["Domótica e Iluminación", "Robótica Industrial", "Diseño Mecánico"],
    6: ["Mantenimiento Mecatrónico", "Automatización Industrial", "Diseño y Simulación Electrónico", "Diseño Asistido por Computadora y Maquinado Asistido por Computadora"]
  },
  "Técnico en Programación Web": {
    1: ["Lógica de Programación", "Introducción a Redes Computacionales"],
    2: ["Programación en Entorno Visual", "Desarrollo de Páginas Web", "Introducción a las Bases de Datos"],
    3: ["Introducción a la Programación Orientada a Objetos", "Diseño Avanzado de Páginas Web", "Administración de Base de Datos", "Mantenimiento y Configuración de Equipos"],
    4: ["Sistemas Operativos", "Fundamentos de Programación", "Desarrollo de Sistemas Web"],
    5: ["Desarrollo de Páginas Web Dinámicas", "Base de Datos con Páginas Web Dinámicas", "Desarrollo de Sistemas Web con Bases de Datos", "Seguridad en Informática"],
    6: ["Desarrollo Web - Modelo Vista Controlador", "Aplicaciones Móviles", "Programación Orientada a Objetos", "Proyectos Administrativos Web"]
  },
  "Técnico en Soldadura Industrial": {
    1: ["Metalurgia de la Soldadura y Fundición"],
    2: ["Dibujo Básico para Soldadura Industrial", "Metrología y Ajustes para Soldadura Industrial", "Electricidad Básica"],
    3: ["Tratamientos Térmicos", "Soldadura Autógena", "Geometría de Uniones y Simbología de la Soldadura"],
    4: ["Interpretación de Diseño de Soldadura", "Soldadura de Arco Eléctrico con Electrodo Revestido", "Mantenimiento a Máquinas de Soldar"],
    5: ["Técnicas de Supervisión de Soldadura", "Soldadura por Arco Tungsteno con Gas", "Soldadura por Arco Metálico con Gas", "Simulación en Soldadura"],
    6: ["Automatización Básica en los Procesos de Soldadura", "Inspección de Soldaduras", "Pailería", "Mecánica de los Materiales", "Soldadura en Ductos y Tubería"]
  },
  "Técnico en Trabajo Social": {
    1: ["Cultura, Identidad y Entorno Social", "Sociología", "Ética y Derechos Humanos en Trabajo Social"],
    2: ["Trabajo Social de Grupo y sus Áreas de Intervención", "Etapas del Desarrollo y la Calidad de Vida", "Psicología"],
    3: ["Técnicas y Dinámicas Pedagógicas", "Trabajo Social de Casos", "Desarrollo Humano en Trabajo Social", "Investigación Social", "Introducción al Derecho"],
    4: ["Bienestar y Calidad de Vida", "Metodologías y Práctica del Trabajo Social Comunitario", "Derecho de Personas y Familia"],
    5: ["Trabajo Social Empresarial", "La Educación como Función del Trabajo Social", "Salud Pública", "Estadística"],
    6: ["Peritaje Social", "Políticas Sociales en México", "Derecho Penal", "Derecho Laboral", "Derecho de Amparo"]
  },
  "Técnico en Turismo": {
    1: ["Principios de Turismo", "Hotelería"],
    2: ["Liderazgo y Negociación", "Administración de Hoteles", "Patrimonio Turístico Nacional", "Socioantropología del Turismo"],
    3: ["Control de Costos de Alimentos y Bebidas", "Inglés para Turismo I", "Patrimonio Turístico Mundial", "Administración de Alimentos"],
    4: ["Introducción a Sobrecargo de Aviación", "Inglés para Turismo II", "Historia del Arte Mexicano", "Promoción Turística"],
    5: ["Entorno Laboral", "Contabilidad", "Inglés para Turismo III", "Gastronomía Básica", "Operación de Viajes"],
    6: ["Gestión Empresarial", "Economía", "Administración de Grupos y Convenciones", "Legislación Turística", "Administración de Bebidas", "Relaciones Públicas"]
  }
};

function toMateriasFieldValue(nombreAcademia) {
  const porSemestre = plan[nombreAcademia];
  if (!porSemestre) return null;
  const values = [];
  for (const semestre of [1, 2, 3, 4, 5, 6]) {
    for (const nombre of porSemestre[semestre] || []) {
      values.push({
        mapValue: {
          fields: {
            nombre: { stringValue: nombre },
            semestre: { integerValue: String(semestre) }
          }
        }
      });
    }
  }
  return values;
}

async function main() {
  const res = await fetch(`${BASE_URL}/academias?pageSize=50`);
  const data = await res.json();
  for (const docu of data.documents) {
    const id = docu.name.split("/").pop();
    const nombre = docu.fields.nombre.stringValue;
    const values = toMateriasFieldValue(nombre);
    if (!values) {
      console.log(`SIN PLAN: ${nombre} (se deja igual)`);
      continue;
    }
    const patchRes = await fetch(`${BASE_URL}/academias/${id}?updateMask.fieldPaths=materias`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ fields: { materias: { arrayValue: { values } } } })
    });
    console.log(`${nombre}: ${patchRes.ok ? `OK (${values.length} materias etiquetadas)` : "ERROR " + (await patchRes.text())}`);
  }
}

main();
