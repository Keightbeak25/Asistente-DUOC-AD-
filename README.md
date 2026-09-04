Asistente Académico DUOC UC

Asistente conversacional basado en un LLM que orienta a estudiantes de DUOC UC sobre consultas académicas y administrativas frecuentes: fechas de calendario académico, matrícula, semana cero, retiro de asignaturas, exámenes, feriados institucionales y otros procesos clave del año académico 2026.

Proyecto académico desarrollado para la asignatura Fundamentos de IA Generativa y Prompt Engineering (Duoc UC). No representa un canal oficial de la institución.

1. Problema que resuelve

Los estudiantes necesitan responder dudas frecuentes y urgentes (fechas de matrícula, semana cero, retiro de asignaturas, exámenes, feriados) pero esta información está dispersa entre distintos documentos y canales oficiales, lo que genera confusión, pérdida de tiempo y consultas repetitivas hacia secretaría académica.

2. Solución propuesta

Un agente conversacional basado en un LLM (vía API de OpenRouter) que:

Responde exclusivamente con información verificada, evitando alucinaciones de fechas o requisitos.
Utiliza una herramienta de búsqueda (tool calling) sobre una base de datos estructurada con los calendarios académicos oficiales 2026 (modalidad base/presencial y online).
Deriva al estudiante a un funcionario o canal oficial cuando la consulta requiere revisión de un caso individual (apelaciones, becas, convalidaciones específicas, situaciones de salud).
3. Arquitectura de la solución
Estudiante (consola/CLI)
        │
        ▼
   src/app.js  ──► interfaz de línea de comandos (readline)
        │
        ▼
 src/chatbot.js ──► orquesta la conversación:
        │             - carga el system prompt (prompt.txt)
        │             - mantiene historial por usuario (últimos 20 mensajes)
        │             - llama a la API de OpenRouter (modelo LLM)
        │             - si el modelo solicita la tool "buscar_calendario_duoc",
        │               ejecuta la búsqueda y reinyecta el resultado
        ▼
 src/calendario.js ──► base de conocimiento estructurada:
                         - registros de fechas oficiales 2026 (base/presencial y online)
                         - normalización de texto (tildes, errores comunes)
                         - búsqueda por coincidencia de palabras clave

Nota sobre el diseño de recuperación (RAG): en lugar de una búsqueda vectorial/embeddings clásica, se implementó una recuperación por coincidencia de palabras clave sobre una base de datos estructurada (JSON) de fechas oficiales. Esta decisión se tomó porque los datos son tabulares, de baja ambigüedad semántica y de alta sensibilidad a errores (una fecha equivocada es un error crítico), por lo que priorizar precisión y trazabilidad sobre búsqueda semántica difusa resultó más adecuado para este caso de uso.

4. Stack técnico
Componente	Tecnología
Runtime	Node.js ≥ 20
Framework	Express (definido en dependencias, interfaz actual es CLI)
Modelo LLM	Accedido vía API de OpenRouter
Manejo de variables de entorno	dotenv
Interfaz	Consola (readline) — versión local, sin conexión a WhatsApp
5. Estructura del repositorio
Asistente Academico DUOC/
├── src/
│   ├── app.js         # punto de entrada, interfaz de consola
│   ├── chatbot.js      # lógica de orquestación del LLM y tool calling
│   ├── calendario.js   # base de conocimiento y motor de búsqueda de fechas
│   └── prompt.txt      # system prompt del agente
├── .env.example        # plantilla de variables de entorno (sin claves reales)
├── .gitignore           # excluye node_modules/ y .env
├── package.json
└── README.md
6. Instalación y ejecución
Requisitos previos
Node.js versión 20 o superior instalado.
Una cuenta y API key de OpenRouter.
Pasos
Clonar el repositorio:
bash
   git clone <URL-del-repositorio>
   cd "Asistente Academico DUOC"
Instalar dependencias:
bash
   npm install
Configurar variables de entorno:
Duplicar el archivo .env.example y renombrarlo a .env.
Completar con tu propia API key de OpenRouter:
     OPENROUTER_API_KEY=tu_clave_aqui
     OPENROUTER_MODEL=openai/gpt-5.4
Importante: el archivo .env nunca debe subirse al repositorio (ya está excluido en .gitignore).
Ejecutar el asistente:
bash
   npm start
Interactuar con el asistente directamente en la consola. Para salir, escribir salir.
7. Ejemplo de uso
asistente académico duoc
escribe 'salir' para terminar.

tú: ¿cuándo es la matrícula de continuidad para el primer semestre 2026?
bot: Según el calendario académico 2026, la matrícula de continuidad ordinaria
para el primer semestre 2026-1 es del 01-12-2025 al 12-01-2026 (modalidad
base/presencial). ¿Necesitas la fecha para modalidad online también?
8. Evidencia de pruebas

Ver carpeta /evidencia con capturas de pantalla de conversaciones de prueba, incluyendo:

Consultas de fechas resueltas correctamente (matrícula, semana cero, exámenes, feriados).
Casos de derivación a canal humano (consultas de casos individuales).
Manejo de preguntas ambiguas o fuera de alcance.
9. Limitaciones conocidas
La versión actual funciona como interfaz de consola local, sin conexión a WhatsApp (a diferencia del prototipo inicial desarrollado en Kapso).
La base de conocimiento de fechas está cargada de forma estática en calendario.js; no se actualiza automáticamente si cambia el calendario oficial.
La búsqueda es por coincidencia de palabras clave, no por similitud semántica vectorial.
10. Seguridad
Las credenciales de API se manejan exclusivamente mediante variables de entorno (.env), nunca hardcodeadas en el código.
El archivo .env está excluido del control de versiones mediante .gitignore.
Se provee .env.example como plantilla para que cualquier evaluador pueda configurar su propia clave sin exponer la del equipo de desarrollo.
11. Autores

Proyecto desarrollado por Sebastián Maquera, Camilo Peña y Camilo Alarcón.
