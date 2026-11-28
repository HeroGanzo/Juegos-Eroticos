export type FaqItem = { question: string; answer: string };

/** Preguntas frecuentes con respuestas concretas, pensadas también para asistentes de IA. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Cuál es la edad mínima para entrar al sitio?",
    answer: "Debes ser mayor de 18 años, o tener la mayoría de edad legal en tu país. Al entrar se te pedirá que lo confirmes; el sitio contiene contenido sexual explícito exclusivo para adultos.",
  },
  {
    question: "¿Es gratuito registrarse?",
    answer: "Sí. Crear una cuenta es gratis y te permite ver contenido más explícito, galerías y descargas exclusivas para usuarios registrados. Solo el acceso VIP es de pago o por donación.",
  },
  {
    question: "¿Cómo descargo un juego?",
    answer: "Busca el juego en el catálogo, entra en su ficha y pulsa el botón «Descargar». Verás los enlaces disponibles por plataforma (por ejemplo MEGA, Drive, torrent). Algunos enlaces son exclusivos para miembros VIP.",
  },
  {
    question: "¿Qué incluye el acceso VIP?",
    answer: "El acceso VIP desbloquea todo el contenido exclusivo: juegos completos, versiones sin censura, enlaces de descarga directos y rápidos, actualizaciones anticipadas y soporte prioritario.",
  },
  {
    question: "¿Cómo me hago VIP?",
    answer: "Entra en la sección VIP, elige un plan de donación o suscripción, realiza el pago y envía el formulario de solicitud con el comprobante de transacción. Un administrador lo verificará y activará tu acceso.",
  },
  {
    question: "¿En qué plataformas están disponibles los juegos?",
    answer: "Principalmente Windows y Android. Algunas publicaciones también incluyen versiones para Mac, Linux o navegador. Cada ficha indica sus plataformas con etiquetas.",
  },
  {
    question: "¿Los archivos del sitio son seguros?",
    answer: "Los juegos están revisados y organizados por el equipo del sitio. Descarga siempre desde los enlaces oficiales de cada ficha y evita mirrors de terceros.",
  },
  {
    question: "¿Puedo solicitar un juego que no esté en el catálogo?",
    answer: "Sí. Usa el formulario de contacto para proponernos un título. Lo valoraremos para añadirlo en próximas actualizaciones del catálogo.",
  },
  {
    question: "¿Todo el contenido está sin censura?",
    answer: "Hay contenido público, contenido más explícito para usuarios registrados y contenido exclusivo sin censura para miembros VIP. Cada ficha indica su nivel de acceso con una insignia.",
  },
  {
    question: "¿Cómo puedo contactar con el administrador?",
    answer: "Por correo electrónico, WhatsApp, Telegram o el formulario de contacto de la página. Todos los datos están en la sección de contacto del sitio.",
  },
  {
    question: "¿Cómo puedo eliminar mi cuenta?",
    answer: "Escríbenos por cualquiera de los canales de contacto solicitando la eliminación de tu cuenta y los datos asociados. Tramitaremos la baja conforme a la normativa de protección de datos aplicable.",
  },
];

export const FAQ_PAGE = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas rápidas sobre el sitio de juegos para adultos: edad mínima, registro, descargas, acceso VIP, plataformas, seguridad y contacto.",
  path: "/preguntas-frecuentes",
};
