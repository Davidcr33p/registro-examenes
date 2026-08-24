// Carga (o recarga) el catálogo real de academias técnicas y sus materias en
// Firestore, a partir del plan de estudios de la Preparatoria Álvaro Obregón
// — UANL, Unidad Monterrey I (Plantel Churubusco).
//
// Solo incluye las materias de especialidad de cada academia: se excluyen
// tanto el Tronco Común (matemáticas, idiomas, orientación, deporte, etc.)
// como las materias administrativas/genéricas que se repiten igual en las
// 18 academias (Introducción a los Procesos Industriales..., Administración,
// Bioética Personalista, Fundamentos de la Solución de Conflictos, Sistemas
// de Calidad, Formación de Emprendedores) — el usuario pidió "solo las
// materias técnicas".
//
// Uso: node scripts/seed-academias.mjs
// Requiere Node 18+ (usa fetch nativo). No necesita credenciales: la
// colección `academias` tiene lectura/escritura abierta a propósito
// (ver firestore.rules).

const PROJECT_ID = "registro-examenes-eiao";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const academias = [
  {
    nombre: "Técnico en Administrador Contable",
    materias: [
      "Introducción a la Contabilidad",
      "Derecho Mercantil",
      "Contabilidad I",
      "Cálculo Mercantil",
      "Hoja de Cálculo",
      "Contabilidad II",
      "Administración Empresarial",
      "Sistemas de Aplicación Contable",
      "Base de Datos en Contabilidad",
      "Sistema Financiero Mexicano",
      "Nóminas Electrónicas Integrales",
      "Contabilidad de Sociedades",
      "Inglés para Negocios I",
      "Costos",
      "Derecho Fiscal",
      "Introducción a las Finanzas",
      "Principios de Microeconomía",
      "Introducción a los Impuestos",
      "Inglés para Negocios II",
      "Recursos Humanos"
    ]
  },
  {
    nombre: "Técnico en Aire Acondicionado y Refrigeración",
    materias: [
      "Sistema de Unidades para Refrigeración",
      "Soldadura Elemental",
      "Dibujo Elemental",
      "Electricidad para Refrigeración",
      "Refrigeración Elemental",
      "Electrónica Elemental para Aire Acondicionado y Refrigeración",
      "Refrigeración Doméstica y Comercial",
      "Soldaduras Especiales para Aire Acondicionado y Refrigeración",
      "Calderas",
      "Electricidad para Aire Acondicionado y Refrigeración",
      "Aire Acondicionado Minisplit e Inverter",
      "Sistemas de Refrigeración para Transporte Comercial",
      "Electricidad para Unidades Centrales y Cuartos Fríos",
      "Electrónica de Control",
      "Cuartos Fríos",
      "Control Lógico Programable para Refrigeración y Aire Acondicionado",
      "Aire Acondicionado Central",
      "Tratamientos Térmicos y Termodinámica de Gases",
      "Aire Acondicionado para Vehículos"
    ]
  },
  {
    nombre: "Técnico en Aplicaciones Audiovisuales",
    materias: [
      "Ilustración Digital Básica",
      "Historia y Fundamentos del Diseño Gráfico",
      "Diseño y Edición Digital",
      "Tipografía",
      "Representaciones Creativas",
      "Fotografía Básica",
      "Diseño de Páginas Web",
      "Publicidad y Creatividad",
      "Medios Digitales",
      "Diseño Editorial",
      "Técnicas de Impresión",
      "Diseño Tridimensional",
      "Diseño de Empaques y Maquetas para Mercadotecnia",
      "Ilustración Digital Avanzada",
      "Animación Multimedia",
      "Edición de Medios Digitales",
      "Identidad Corporativa",
      "Gráficos Digitales en Movimiento",
      "Taller Integral",
      "Diseño de Material Didáctico"
    ]
  },
  {
    nombre: "Técnico en Biotecnología Industrial",
    materias: [
      "Bioseguridad y Material de Laboratorio",
      "Introducción a la Biotecnología",
      "Introducción a las Técnicas Analíticas",
      "Introducción a la Microbiología",
      "Técnicas Analíticas de Laboratorio",
      "Química de los Compuestos Orgánicos",
      "Tópicos de Química",
      "Metodologías de Laboratorio",
      "Microbiología Analítica",
      "Fundamentos de Bioquímica",
      "Análisis de Aguas",
      "Biología Celular",
      "Introducción a los Procesos de Fermentación",
      "Microbiología de Alimentos",
      "Taller de Productos Químicos",
      "Técnicas de Análisis de Alimentos"
    ]
  },
  {
    nombre: "Técnico en Dibujante Industrial",
    materias: [
      "Medición e Interpretación de Planos",
      "Dibujo Básico",
      "Dibujo Mecánico",
      "Herramientas de Dibujo",
      "Procesos de Máquinas",
      "Dibujo de Modelos Mecánicos para Ensamble",
      "Bocetos y Dibujo Artístico",
      "Retoque y Diseño de Modelos",
      "Elementos Mecánicos",
      "Dibujo de Detalle",
      "Procesos de Impresión",
      "Dibujos Especializados",
      "Dibujo de Sólidos",
      "Modelado en 3D",
      "Modelado Virtual de Proyectos",
      "Dibujo e Interpretación de Planos Arquitectónicos"
    ]
  },
  {
    nombre: "Técnico en Electricista",
    materias: [
      "Instrumentación y Medición de las Magnitudes Eléctricas",
      "Dibujo Eléctrico Industrial",
      "Electricidad y Magnetismo",
      "Reparación de Motores Eléctricos",
      "Instalaciones Eléctricas Residenciales",
      "Diseño de Circuitos Asistido por Computadora",
      "Circuitos Eléctricos",
      "Funcionamiento de Motores y Generadores",
      "Mantenimiento en Sistemas de Energía Fotovoltaica",
      "Funcionamiento de Transformadores Eléctricos",
      "Sensores y Accionamientos Eléctricos",
      "Control Eléctrico de Motores",
      "Instalación Eléctrica de Minisplits",
      "Fundamentos de Electrónica de Potencia",
      "Mantenimiento en Sistemas de Iluminación y Energía Renovable",
      "Sistemas Digitales",
      "Sistemas Domóticos",
      "Mantenimiento de Subestaciones Eléctricas",
      "Instalación y Operación de los Sistemas de Control",
      "Internet de las Cosas"
    ]
  },
  {
    nombre: "Técnico en Electromecánico Industrial",
    materias: [
      "Instrumentación para Electromecánicos",
      "Mantenimiento Productivo Total",
      "Dibujo Básico para Electromecánicos",
      "Electricidad para Electromecánicos",
      "Elementos y Herramientas en Electromecánica",
      "Tecnología de Materiales",
      "Mantenimiento a Motores Eléctricos",
      "Diagnóstico de Fallas en Elementos Mecánicos",
      "Soldadura Básica para Electromecánicos",
      "Dibujo Electromecánico",
      "Circuitos Eléctricos y Electrónicos de Potencia",
      "Electroneumática e Hidráulica Industrial",
      "Refrigeración y Aire Acondicionado",
      "Control Lógico Programable para Mecánico Eléctrico",
      "Principios de Taladrado y Torneado Convencional",
      "Transformadores y Subestaciones",
      "Mantenimiento a Máquinas de Soldar para Electromecánicos",
      "Fresado y Rectificado",
      "Proyecto de Sistemas Electromecánicos",
      "Soldaduras Especiales",
      "Mantenimiento Electromecánico"
    ]
  },
  {
    nombre: "Técnico en Electromovilidad",
    materias: [
      "Electrotecnia en Electromovilidad",
      "Introducción a la Mecánica Automotriz",
      "Interpretación de Diagramas Eléctrico-Electrónicos",
      "Reparación de Motores de Combustión Interna",
      "Electricidad y Electrónica de Potencia",
      "Diseño de Circuitos de Corriente Alterna y de Corriente Directa",
      "Afinación de Motores de Combustión Interna",
      "Autotrónica en Electromovilidad",
      "Motores y Generadores para Vehículos",
      "Ajustes Técnicos y Soldadura",
      "Sistemas Híbridos de Combustión",
      "Gestión del Taller de Servicio Automotriz",
      "Automóviles Híbridos y Eléctricos",
      "Sistemas de Enfriamiento para Vehículos Híbridos y Eléctricos",
      "Sistema de Navegación Inteligente",
      "Sistema Eléctrico para Vehículos",
      "Tren de Potencia en Vehículos con Fuente Eléctrica",
      "Sistemas Híbridos y Eléctricos en el Servicio Pesado",
      "Manejo de Sistemas de Alto Voltaje en Vehículos Híbridos y Eléctricos",
      "Electrosistemas de Suspensión y Frenos"
    ]
  },
  {
    nombre: "Técnico en Electrónica Industrial",
    materias: [
      "Diseño Asistido por Computadora para Electrónica",
      "Electrónica Digital",
      "Circuitos de Corriente Directa y Corriente Alterna para Electrónica",
      "Introducción al Taller de Electrónica",
      "Fundamentos de las Telecomunicaciones y Conexión de Equipos",
      "Introducción a la Programación para Microcontroladores",
      "Temas Selectos de Electrónica",
      "Automatización",
      "Interpretación de Planos Electrónicos",
      "Sistemas Digitales Programables",
      "Circuitos Integrados Programables",
      "Mantenimiento Industrial",
      "Aplicaciones Industriales de Control Lógico Programable",
      "Elementos de Control de Potencia",
      "Control Lógico Programable",
      "Control de Motores de Corriente Directa y Corriente Alterna para Electrónica",
      "Electrónica Embarcada",
      "Arquitectura y Programación de Robots",
      "Domótica",
      "Proyecto Electrónico"
    ]
  },
  {
    nombre: "Técnico en Energías Renovables",
    materias: [
      "Instrumentos de Medición",
      "Introducción a las Energías Renovables",
      "Soldadura Básica para Energías Renovables",
      "Prevención de Riesgos Eléctricos",
      "Medio Ambiente y Sostenibilidad",
      "Circuitos Eléctricos Electrónicos",
      "Gestión Eficiente de Energías en Edificaciones",
      "Uso Eficiente de Energía",
      "Manejo de Residuos",
      "Inglés para Energías Renovables",
      "Técnicas de Instalaciones Eléctricas",
      "Circuitos de Inducción",
      "Acumuladores, Controladores e Inversores",
      "Domótica e Iluminación",
      "Motores y Generadores Eléctricos",
      "Elementos y Dispositivos Electromecánicos",
      "Energía Fotovoltaica",
      "Proyecto Energético",
      "Energía Eólica",
      "Automatización y Control Industrial",
      "Energía Solar Térmica",
      "Diseño por Computadora en las Energías Renovables",
      "Normatividad"
    ]
  },
  {
    nombre: "Técnico en Inteligencia Artificial",
    materias: [
      "Introducción a la Programación",
      "Infraestructura e Informática en la Nube",
      "Introducción a la Inteligencia Artificial",
      "Paradigmas de la Programación",
      "Análisis de Algoritmos",
      "Visualización de Datos",
      "Principios de Electrónica",
      "Diseño de Interfaces Web",
      "Diseño de Bases de Datos",
      "Dispositivos Electrónicos",
      "Preprocesamiento de Imágenes",
      "Patrones de Diseño Web",
      "Desarrollo de Aplicaciones Móviles",
      "Visión Computacional",
      "Aplicaciones Multiplataforma",
      "Aprendizaje Supervisado",
      "Algoritmo Bio Inspirador",
      "Comunicación Integral en Inglés Técnico I",
      "Gestión de Proyectos con Tecnologías de Información",
      "Aprendizaje No Supervisado",
      "Redes Neuronales y Aprendizaje Profundo",
      "Proyectos de Aprendizaje Automático",
      "Aplicaciones de la Inteligencia Artificial",
      "Comunicación Integral en Inglés Técnico II"
    ]
  },
  {
    nombre: "Técnico en Máquinas-Herramientas Industriales",
    materias: [
      "Metrología y Ajustes para Máquinas-Herramientas Industriales",
      "Dibujo Básico para Máquinas-Herramientas Industriales",
      "Fundamentos de Torneado Convencional",
      "Soldadura Eléctrica",
      "Interpretación de Planos Mecánicos",
      "Maquinado de Roscas en Torno Convencional",
      "Dibujo Auxiliado por Computadora",
      "Mantenimiento Productivo Total",
      "Diseño de Elementos Mecánicos",
      "Fundamentos de Fresado Convencional",
      "Fundamentos de Torneado con Control Numérico Computarizado",
      "Temas Selectos de Automatización",
      "Maquinado de Precisión en Torno Convencional",
      "Fundamentos de Fresado con Control Numérico Computarizado",
      "Mecánica de Materiales",
      "Procesos de Manufactura",
      "Maquinado Auxiliado por Computadora",
      "Procesos de Torneado con Control Numérico Computarizado",
      "Proyecto de Máquinas Industriales"
    ]
  },
  {
    nombre: "Técnico en Mecánica Automotriz y Autotrónica",
    materias: [
      "Introducción al Taller Automotriz",
      "Sistema Eléctrico del Automóvil",
      "Afinación de Motores",
      "Autotrónica I",
      "Reparación de Motores a Gasolina",
      "Reparación de Carrocería",
      "Soluciones Técnicas y Soldadura",
      "Mantenimiento Motores Diesel",
      "Sistemas de Aire Acondicionado Automotriz",
      "Motores de Equipo y Vehículos Ligeros",
      "Reparación y Ajuste de Motores Diesel",
      "Tren Motriz",
      "Administración del Taller de Servicio Automotriz",
      "Autotrónica II",
      "Sistemas Electrónicos Diesel",
      "Automóviles Híbridos y Eléctricos",
      "Sistemas de Suspensión y Frenos"
    ]
  },
  {
    nombre: "Técnico en Mecatrónica Industrial",
    materias: [
      "Introducción a la Mecatrónica",
      "Principios de Electricidad",
      "Sensórica",
      "Electrónica Analógica",
      "Circuitos Lógicos Digitales",
      "Procesos de Medición y Ajustes",
      "Potencia Fluida",
      "Técnicas de Instalaciones Eléctricas",
      "Electrónica de Potencia",
      "Motores Eléctricos",
      "Dibujo para Mecatrónica",
      "Mecánica de Concepción",
      "Automatización con Control Lógico Programable",
      "Microcontroladores",
      "Domótica e Iluminación",
      "Robótica Industrial",
      "Diseño Mecánico",
      "Mantenimiento Mecatrónico",
      "Automatización Industrial",
      "Diseño y Simulación Electrónico",
      "Diseño Asistido por Computadora y Maquinado Asistido por Computadora"
    ]
  },
  {
    nombre: "Técnico en Programación Web",
    materias: [
      "Lógica de Programación",
      "Introducción a Redes Computacionales",
      "Programación en Entorno Visual",
      "Desarrollo de Páginas Web",
      "Introducción a las Bases de Datos",
      "Introducción a la Programación Orientada a Objetos",
      "Diseño Avanzado de Páginas Web",
      "Administración de Base de Datos",
      "Mantenimiento y Configuración de Equipos",
      "Sistemas Operativos",
      "Fundamentos de Programación",
      "Desarrollo de Sistemas Web",
      "Desarrollo de Páginas Web Dinámicas",
      "Base de Datos con Páginas Web Dinámicas",
      "Desarrollo de Sistemas Web con Bases de Datos",
      "Seguridad en Informática",
      "Desarrollo Web - Modelo Vista Controlador",
      "Aplicaciones Móviles",
      "Programación Orientada a Objetos",
      "Proyectos Administrativos Web"
    ]
  },
  {
    nombre: "Técnico en Soldadura Industrial",
    materias: [
      "Metalurgia de la Soldadura y Fundición",
      "Dibujo Básico para Soldadura Industrial",
      "Metrología y Ajustes para Soldadura Industrial",
      "Electricidad Básica",
      "Tratamientos Térmicos",
      "Soldadura Autógena",
      "Geometría de Uniones y Simbología de la Soldadura",
      "Interpretación de Diseño de Soldadura",
      "Soldadura de Arco Eléctrico con Electrodo Revestido",
      "Mantenimiento a Máquinas de Soldar",
      "Técnicas de Supervisión de Soldadura",
      "Soldadura por Arco Tungsteno con Gas",
      "Soldadura por Arco Metálico con Gas",
      "Simulación en Soldadura",
      "Automatización Básica en los Procesos de Soldadura",
      "Inspección de Soldaduras",
      "Pailería",
      "Mecánica de los Materiales",
      "Soldadura en Ductos y Tubería"
    ]
  },
  {
    nombre: "Técnico en Trabajo Social",
    materias: [
      "Cultura, Identidad y Entorno Social",
      "Sociología",
      "Ética y Derechos Humanos en Trabajo Social",
      "Trabajo Social de Grupo y sus Áreas de Intervención",
      "Etapas del Desarrollo y la Calidad de Vida",
      "Psicología",
      "Técnicas y Dinámicas Pedagógicas",
      "Trabajo Social de Casos",
      "Desarrollo Humano en Trabajo Social",
      "Investigación Social",
      "Introducción al Derecho",
      "Bienestar y Calidad de Vida",
      "Metodologías y Práctica del Trabajo Social Comunitario",
      "Derecho de Personas y Familia",
      "Trabajo Social Empresarial",
      "La Educación como Función del Trabajo Social",
      "Salud Pública",
      "Estadística",
      "Peritaje Social",
      "Políticas Sociales en México",
      "Derecho Penal",
      "Derecho Laboral",
      "Derecho de Amparo"
    ]
  },
  {
    nombre: "Técnico en Turismo",
    materias: [
      "Principios de Turismo",
      "Hotelería",
      "Liderazgo y Negociación",
      "Administración de Hoteles",
      "Patrimonio Turístico Nacional",
      "Socioantropología del Turismo",
      "Control de Costos de Alimentos y Bebidas",
      "Inglés para Turismo I",
      "Patrimonio Turístico Mundial",
      "Administración de Alimentos",
      "Introducción a Sobrecargo de Aviación",
      "Inglés para Turismo II",
      "Historia del Arte Mexicano",
      "Promoción Turística",
      "Entorno Laboral",
      "Contabilidad",
      "Inglés para Turismo III",
      "Gastronomía Básica",
      "Operación de Viajes",
      "Gestión Empresarial",
      "Economía",
      "Administración de Grupos y Convenciones",
      "Legislación Turística",
      "Administración de Bebidas",
      "Relaciones Públicas"
    ]
  }
];

function toFirestoreFields(academia) {
  return {
    fields: {
      nombre: { stringValue: academia.nombre },
      materias: {
        arrayValue: {
          values: academia.materias.map((m) => ({ stringValue: m }))
        }
      }
    }
  };
}

async function main() {
  for (const academia of academias) {
    const res = await fetch(`${BASE_URL}/academias`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(toFirestoreFields(academia))
    });
    if (!res.ok) {
      console.error(`Error en "${academia.nombre}":`, await res.text());
      continue;
    }
    console.log(`OK: ${academia.nombre} (${academia.materias.length} materias)`);
  }
}

main();
