// ─── HalfPace Coach Engine ────────────────────────────────────────────────
// Zero-cost AI coach using keyword detection + contextual responses.
// No API calls needed. Works fully offline.

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────
const KB = {

  // LESIONES
  lesion: {
    keywords: ['lesión','lesion','duele','dolor','molestia','tengo','fascia','rodilla','gemelo','tobillo','shin','tibia','isquio','cadera','espalda','ampollas','rozadura','contractura','inflam'],
    responses: [
      {
        match: ['rodilla','rodillas'],
        title: '🦵 Dolor de rodilla',
        body: `El dolor de rodilla en corredores suele ser síndrome de la banda iliotibial o condromalacia. Recomendaciones:
• Para el entreno de hoy y descansa 2-3 días.
• Aplica hielo 15 min, 3 veces al día.
• Haz estiramientos de cuádriceps y banda IT.
• Cuando vuelvas, empieza con rodajes suaves a ritmo muy cómodo.
Si persiste más de 5 días, visita un fisioterapeuta deportivo.`,
      },
      {
        match: ['gemelo','gemelos','pantorrilla'],
        title: '🦵 Dolor de gemelo',
        body: `Puede ser sobrecarga o inicio de rotura fibrilar. No lo ignores:
• Detén el entrenamiento inmediatamente.
• Reposa 48-72h y aplica hielo las primeras 24h.
• Evita estirar en la fase aguda (primeras 48h).
• Vuelve al trote muy suave solo cuando no haya dolor al caminar.
Si notas un "chasquido" o inflamación visible, ve al médico.`,
      },
      {
        match: ['tobillo'],
        title: '🦶 Dolor de tobillo',
        body: `Descansa hoy. Si es un esguince leve (RICE): Reposo, Hielo, Compresión, Elevación. Si puedes apoyar sin dolor, en 3-4 días puedes probar trote suave en superficies blandas. Refuerza con ejercicios de propiocepción (equilibrio sobre un pie) para prevenir recaídas.`,
      },
      {
        match: ['fascia','fascitis','planta','talón','talon'],
        title: '🦶 Fascitis plantar',
        body: `La fascitis plantar es muy común en preparaciones de media maratón. 
• Reduce el volumen un 30% esta semana.
• Masajea la planta con una pelota de tenis cada mañana (2 min cada pie).
• Estira el sóleo (rodilla doblada) 3×30s tras cada entreno.
• Usa plantillas de talón si el dolor es intenso.
La clave es no ignorarla — tratada a tiempo se resuelve en 2-3 semanas.`,
      },
      {
        match: ['tibia','shin','periostio'],
        title: '🦴 Periostitis tibial (shin splints)',
        body: `Inflamación del periostio tibial, muy frecuente cuando se aumenta el volumen rápido.
• Reduce el volumen un 40% esta semana y evita cuestas.
• Hielo tras cada entreno, 15 minutos.
• Revisa tus zapatillas — puede ser que estén desgastadas.
• Incorpora ejercicios de fortalecimiento de tibial anterior.
Si el dolor es en un punto concreto y muy intenso, descarta fractura por estrés con tu médico.`,
      },
      {
        match: ['isquio','isquiotibial'],
        title: '🦵 Isquiotibiales',
        body: `Zona muy delicada. Si es tensión: reduce intensidad y haz estiramientos suaves. Si es dolor agudo durante el sprint o cambio de ritmo, puede ser un desgarro — para completamente y consulta fisio. No fuerces nunca un isquiotibial tenso.`,
      },
    ],
    fallback: {
      title: '🩹 Posible lesión',
      body: `Ante cualquier dolor que cambie tu forma de correr, lo primero es parar. Correr con dolor casi siempre empeora la lesión y puede convertir algo menor en algo serio.
• Evalúa: ¿dónde duele exactamente? ¿al apoyar, al correr o siempre?
• Si solo duele corriendo: reduce ritmo e intensidad.
• Si duele al caminar: descansa 2-3 días mínimo.
• Si persiste: fisioterapeuta deportivo, no esperes.
Tu plan tiene margen para 2-3 días de descanso sin perder la forma.`,
    }
  },

  // NUTRICIÓN
  nutricion: {
    keywords: ['comer','comida','nutrición','nutricion','alimentación','alimentacion','beber','hidrat','carbohidrato','proteína','proteina','gel','glucosa','desayuno','antes','después','despues','energía','energia'],
    responses: [
      {
        match: ['antes','previa','pre-entreno','preentrenamiento'],
        title: '🍌 Antes del entreno',
        body: `Depende de la duración y hora:
**Entrenos hasta 1h:** No hace falta comer nada si desayunaste bien. Si entrenas en ayunas, es perfectamente válido para rodajes suaves.
**Entrenos de 1-2h:** Un plátano o tostada con miel 45-60 min antes.
**Tirada larga (+2h):** Desayuno completo 2-3h antes: avena, tostadas con AOVE, fruta y café. Empieza con los depósitos llenos.`,
      },
      {
        match: ['después','despues','post','recuperación','recuperacion'],
        title: '🥗 Después del entreno',
        body: `La ventana de recuperación es clave:
• **Primeros 30 min:** proteína + carbohidrato. Un batido de leche con plátano, o yogur con fruta y granola.
• **2h después:** comida completa con proteína (pollo, huevo, legumbres) + carbohidratos complejos (arroz, pasta, patata).
Para la tirada larga, prioriza carbohidratos ese día — tu cuerpo necesita recargar glucógeno.`,
      },
      {
        match: ['tirada','larga','largo','21','media maratón','maratón'],
        title: '🏃 Nutrición en tirada larga',
        body: `Para tiradas de más de 75 minutos:
• **Hidratación:** bebe 150-200ml cada 20 min desde el principio, no cuando tengas sed.
• **Desde el km 8-10:** empieza a tomar energía. Un gel cada 30-40 min o dátiles, gominolas energéticas, plátano.
• **Día anterior:** cena rica en carbohidratos (pasta, arroz) sin excesos de grasa ni fibra.
• **Practica siempre** con la nutrición que usarás en carrera — el estómago también se entrena.`,
      },
      {
        match: ['gel','geles','isotónico','bebida','electrolit'],
        title: '⚡ Geles e isotónicos',
        body: `Los geles son tu mejor aliado en carrera larga:
• Tómalos siempre con agua, nunca solos.
• Primer gel: km 8-10 (antes de necesitarlo).
• Siguientes: cada 30-35 min.
• Prueba la marca en los entrenos largos para saber cómo reacciona tu estómago.
Los isotónicos sustituyen bien a agua + gel si los toleras. Evita mezclar gel + isotónico en el mismo momento — sobrecarga el sistema digestivo.`,
      },
    ],
    fallback: {
      title: '🥗 Nutrición para running',
      body: `La nutrición para un corredor de media maratón es bastante sencilla:
• **Carbohidratos** son tu combustible principal — arroz, pasta, avena, patata, pan.
• **Proteína** para recuperar — 1.4-1.6g por kg de peso al día.
• **Hidratación** — orina clara = bien hidratado. Si es oscura, bebe más.
• **Días de entreno fuerte:** más carbohidratos. **Días de descanso:** más proteína y verduras.
No necesitas suplementos especiales. Una dieta variada y suficiente es todo lo que necesitas.`,
    }
  },

  // RITMOS Y ZONAS
  ritmo: {
    keywords: ['ritmo','ritmos','velocidad','rápido','rapido','lento','zona','z1','z2','z3','z4','z5','umbral','fartlek','intervalo','intervalo','series','tempo','fc','frecuencia cardíaca','pulsaciones','bpm'],
    responses: [
      {
        match: ['z2','zona 2','aeróbico','aerobico','fácil','facil','suave','conversacional'],
        title: '🟢 Zona 2 — Rodaje suave',
        body: `La Zona 2 es la base de todo. Deberías poder mantener una conversación entera sin dificultad.
• **FC:** 60-70% de tu FC máxima (aprox. 130-145 ppm para la mayoría)
• **Sensación:** cómodo, respiración controlada, podrías correr horas
• **Error frecuente:** ir demasiado rápido. Si dudas, ve más lento.
El 70-80% de tu entrenamiento debería ser en esta zona. Es donde se construye el motor aeróbico.`,
      },
      {
        match: ['tempo','umbral','z3','z4','zona 3','zona 4'],
        title: '🟣 Tempo / Umbral láctico',
        body: `El ritmo tempo está en el límite de lo que puedes sostener 40-60 min. Debes poder hablar solo frases cortas.
• **FC:** 80-88% de tu FC máxima (aprox. 160-170 ppm)
• **Sensación:** "duro pero controlado", respiración rítmica pero forzada
• **Beneficio:** sube directamente tu ritmo de media maratón
Para el entreno de tempo típico: 10-15 min calentamiento + 20-30 min a ritmo tempo + 10 min vuelta calma.`,
      },
      {
        match: ['intervalo','intervalos','series','repeticion','repetición'],
        title: '🟡 Intervalos',
        body: `Los intervalos son sesiones de alta intensidad con recuperación entre repeticiones.
• **Formato típico:** 6-8 × 1km a ritmo de 10K con 90s de recuperación trotando
• **FC:** 90-95% de tu FC máxima durante los esfuerzos
• **Clave:** el descanso entre series es tan importante como el esfuerzo
• **Calentamiento:** mínimo 15 min suaves antes de empezar
No hagas más de 2 sesiones de intervalos por semana. La recuperación es donde mejoras.`,
      },
      {
        match: ['mejorar','bajar','tiempo','marca','objetivo'],
        title: '📈 Cómo mejorar tu marca',
        body: `Para bajar tu tiempo en media maratón hay 3 palancas:
1. **Más volumen base** — más km a Zona 2 = motor aeróbico más potente
2. **Un tempo semanal** — mejora directamente el ritmo de carrera
3. **Consistencia** — 10 semanas de entreno regular > 2 semanas perfectas + 2 lesionado
La mejora media en una preparación de 12 semanas bien hecha es de 5-12 minutos.`,
      },
    ],
    fallback: {
      title: '⚡ Ritmos de entrenamiento',
      body: `Los ritmos clave para tu preparación:
• **Rodaje suave (Z2):** ritmo conversacional, la mayoría del tiempo
• **Rodaje medio:** algo más exigente, puedes hablar pero te cuesta
• **Tempo:** duro y controlado, 20-30 min máximo
• **Intervalos:** muy intenso, recuperación entre series
• **Tirada larga:** más lento que tu ritmo objetivo de carrera
Regla de oro: el 80% del tiempo cómodo, el 20% duro. No al revés.`,
    }
  },

  // PLAN Y AJUSTES
  plan: {
    keywords: ['plan','sesión','sesion','cambiar','mover','saltar','semana','descanso','descansar','cancelar','sustituir','adaptar','días','dias','falta','perdido'],
    responses: [
      {
        match: ['cambiar','mover','domingo','sábado','sabado','otro día','otro dia'],
        title: '📅 Cambiar una sesión de día',
        body: `Puedes mover sesiones con estas reglas:
• **Tirada larga** → siempre el día que tengas más tiempo y puedas descansar al día siguiente
• **Intervalos** → necesitan que estés descansado, no los pongas después de una tirada larga
• **Rodaje suave** → el más flexible, se puede mover a cualquier día
• Intenta no juntar dos sesiones duras consecutivas (intervalos + tempo)
Perder una sesión no arruina el plan. Forzar cuando no toca sí puede.`,
      },
      {
        match: ['saltar','perder','perdí','perdi','no pude','cancelar'],
        title: '❌ Me salté un entreno',
        body: `No pasa nada — una sesión perdida no arruina 12 semanas de trabajo.
• **Si fue el rodaje suave:** simplemente sigue con el plan, no lo recuperes.
• **Si fue la tirada larga:** intenta hacerla el día siguiente si tienes tiempo. Si no, también puedes pasar a la semana siguiente.
• **Si llevas más de 3 días sin entrenar:** retoma con un rodaje suave de 30-40 min antes de volver a la intensidad.
La consistencia a largo plazo importa más que una sesión concreta.`,
      },
      {
        match: ['cansado','cansada','fatiga','agotado','agotada','recuper'],
        title: '😴 Fatiga acumulada',
        body: `La fatiga es una señal, no una debilidad. Señales de que necesitas descanso extra:
• Frecuencia cardíaca en reposo elevada (+5-7 ppm de tu normal)
• Piernas pesadas en el segundo día de descanso
• Irritabilidad o falta de motivación
**Qué hacer:** sustituye la sesión de hoy por un descanso activo (paseo, bici suave) o añade un día de descanso extra. Una semana de menos volumen ahora evita semanas de baja por lesión después.`,
      },
      {
        match: ['semana reducción','semana recuperación','descanso activo'],
        title: '🔄 Semana de recuperación',
        body: `Las semanas de recuperación (cada 3-4 semanas) son obligatorias, no opcionales.
• Reduce el volumen un 30-40% respecto a la semana anterior
• Mantén la frecuencia (mismos días) pero acorta las sesiones
• No las saltes aunque te encuentres bien — tu cuerpo se adapta durante el descanso, no durante el esfuerzo
Después de una semana de recuperación, generalmente se corre mejor que nunca.`,
      },
    ],
    fallback: {
      title: '📋 Tu plan de entrenamiento',
      body: `Tu plan de 12 semanas está diseñado con progresión gradual. Principios clave:
• **No aumentes más del 10% de volumen semanal** para evitar lesiones
• **Una sesión de calidad** (intervalos o tempo) por semana es suficiente al principio
• **La tirada larga** es la sesión más importante de la semana — nunca la saltes
• **El descanso** forma parte del plan — los músculos se adaptan cuando recuperas
Si necesitas ajustar algo, cuéntame qué necesitas cambiar.`,
    }
  },

  // CARRERA
  carrera: {
    keywords: ['carrera','race','competición','competicion','dia de carrera','día de carrera','salida','meta','maratón','maraton','media','21km','valencia','race day','estrategia'],
    responses: [
      {
        match: ['estrategia','ritmo','como','cómo','salir'],
        title: '🏁 Estrategia de carrera',
        body: `La estrategia más efectiva para media maratón: **negative split** (segunda mitad algo más rápida que la primera).
• **Km 1-5:** 5-10 seg/km más lento que tu objetivo. El entusiasmo te traiciona aquí.
• **Km 5-15:** ritmo objetivo. Cómodo y controlado.
• **Km 15-18:** mantén. Si te encuentras bien, puedes apretar ligeramente.
• **Km 18-21:** deja todo lo que queda.
Si sales demasiado rápido los primeros 5km, pagarás con creces del 16 al 21.`,
      },
      {
        match: ['semana','antes','previa','tapering','taper','reducir'],
        title: '📉 La semana antes de carrera',
        body: `La semana de la carrera (tapering):
• Reduce el volumen al 40-50% de tu semana normal
• Mantén algún estímulo de calidad (1-2 km a ritmo de carrera el miércoles)
• Duerme bien, hidrátate, come carbohidratos los 2-3 días antes
• No estrenes zapatillas, calcetines ni ropa nueva el día de carrera
• El nerviosismo es normal y buena señal — es energía que aprovecharás`,
      },
      {
        match: ['muro','pared','bonk','bajón','bajon'],
        title: '💀 El muro en media maratón',
        body: `En media maratón el "muro" suele aparecer entre km 15-18 si saliste demasiado rápido o no nutriste bien.
**Para prevenirlo:**
• Sigue la estrategia de ritmo conservador los primeros km
• Primer gel en km 8-9, después cada 30-35 min
• Bebe en cada avituallamiento aunque no tengas sed
**Si aparece:** baja el ritmo 15-20 seg/km, toma un gel si tienes, respira hondo. Suele pasar en 3-5 minutos.`,
      },
    ],
    fallback: {
      title: '🏅 Carrera',
      body: `Para llegar bien al día de la carrera:
• **3 días antes:** cena rica en carbohidratos, nada de experimentos con la comida
• **Noche anterior:** cena temprana y conocida, duerme todo lo que puedas
• **Mañana:** desayuno habitual 2-3h antes, llega pronto al punto de salida
• **Calentamiento:** 10-15 min de trote suave + algunos acelerones cortos
• **En carrera:** empieza conservador, confía en tu entrenamiento`,
    }
  },

  // MOTIVACIÓN
  motivacion: {
    keywords: ['motivación','motivacion','ganas','dejar','dejarlo','abandonar','no puedo','duro','difícil','dificil','mental','flojera','pereza','cansado de','harto'],
    responses: [
      {
        match: ['abandonar','dejar','dejarlo','no merece'],
        title: '💪 No lo dejes',
        body: `Los momentos de querer dejarlo son parte del proceso — todos los corredores los tienen, incluso los élite.
Lo que estás sintiendo es normal en la semana 5-7 de un plan, cuando la novedad pasó pero la meta sigue lejos.
Truco: no pienses en los 21km. Piensa solo en el próximo entreno. Un rodaje suave de 45 min. Eso es todo.
Cuando llegues a la línea de meta, este momento será uno de los que más te alegre haber superado.`,
      },
      {
        match: ['pereza','flojera','ganas','motivar'],
        title: '🔥 Sin ganas de entrenar',
        body: `Algunas estrategias que funcionan:
• **El truco de los 10 minutos:** cálzate y sal con el compromiso de correr solo 10 min. El 90% de las veces acabas haciendo el entreno completo.
• **Cambia el momento:** si siempre entrenas por la tarde y no tienes ganas, prueba mañana por la mañana.
• **Entrena con alguien:** quedar con un amigo del grupo hace que sea casi imposible no ir.
• **Recuerda tu porqué:** ¿qué te hizo apuntarte a esta carrera?`,
      },
    ],
    fallback: {
      title: '💪 La parte mental',
      body: `El running de fondo es 50% físico y 50% mental. Tu cerebro siempre quiere parar antes de que el cuerpo lo necesite realmente.
Técnicas para el día que cuesta:
• Divide la distancia en trozos — "llego al próximo km, a la próxima curva"
• Mantén la mirada al frente, no en el suelo
• Relaja los hombros y las manos conscientemente cada 5 min
• Recuerda los entrenos duros que ya has completado — ya lo has hecho antes`,
    }
  },

  // SALUD GENERAL
  salud: {
    keywords: ['dormir','sueño','sueno','descansar','recovery','recuperación','recuperacion','alcohol','enfermo','enfermedad','gripe','resfriado','fiebre','catarro'],
    responses: [
      {
        match: ['dormir','sueño','sueno','horas'],
        title: '😴 El sueño es entrenamiento',
        body: `El sueño es cuando tu cuerpo realmente mejora. Es tan importante como los km.
• **Mínimo 7-8h** cuando estás en preparación intensa
• La semana de la tirada larga más larga, prioriza el sueño incluso sobre entrenar
• Si duermes mal una noche: no pasa nada. Si llevas una semana durmiendo mal: reduce la carga de entreno
• Siesta de 20-30 min después de la tirada larga = recuperación excelente`,
      },
      {
        match: ['enfermo','gripe','resfriado','fiebre','catarro','constipado'],
        title: '🤒 Entrenar estando enfermo',
        body: `Regla del cuello: 
• **Síntomas por encima del cuello** (mocos, dolor de garganta leve): puedes hacer un rodaje suave corto si te encuentras razonablemente bien.
• **Síntomas por debajo del cuello** (fiebre, dolor muscular, pecho, estómago): descansa completamente hasta 48h después de que desaparezca la fiebre.
Entrenar con fiebre puede derivar en miocarditis (inflamación del corazón). No vale la pena.`,
      },
    ],
    fallback: {
      title: '❤️ Salud del corredor',
      body: `Los pilares de salud para un corredor en preparación:
• **Sueño:** 7-8h mínimo, es cuando adaptas el entrenamiento
• **Hidratación:** orina clara durante el día
• **Alimentación:** no hagas dietas restrictivas durante la preparación
• **Escucha tu cuerpo:** distingue entre el cansancio normal de entrenar y el dolor que avisa de lesión`,
    }
  },
}

// ─── ENGINE ───────────────────────────────────────────────────────────────
export function getCoachResponse(userMessage, userProfile = {}) {
  const msg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Find matching category
  let matchedCategory = null
  let maxMatches = 0

  for (const [catKey, cat] of Object.entries(KB)) {
    const matches = cat.keywords.filter(kw => msg.includes(kw)).length
    if (matches > maxMatches) { maxMatches = matches; matchedCategory = cat }
  }

  if (!matchedCategory || maxMatches === 0) {
    return {
      title: '🏃 Coach HalfPace',
      body: getGenericResponse(msg, userProfile),
    }
  }

  // Find specific response within category
  if (matchedCategory.responses) {
    for (const resp of matchedCategory.responses) {
      if (resp.match.some(kw => msg.includes(kw))) {
        return { title: resp.title, body: resp.body }
      }
    }
  }

  return matchedCategory.fallback
}

function getGenericResponse(msg, profile) {
  const greetings = ['hola','buenas','hey','hi','ola']
  if (greetings.some(g => msg.includes(g))) {
    return `¡Hola ${profile?.name || ''}! 👋 Soy tu coach de HalfPace. Puedo ayudarte con:
• Lesiones y molestias
• Nutrición antes y después del entreno  
• Ritmos y zonas de entrenamiento
• Ajustes en tu plan
• Estrategia de carrera
• Motivación
¿Qué necesitas hoy?`
  }

  const thanks = ['gracias','genial','perfecto','ok','entendido']
  if (thanks.some(g => msg.includes(g))) {
    return `¡De nada! 💪 Sigue así con el plan — estás en el buen camino. Cualquier otra duda, aquí estoy.`
  }

  return `Buena pregunta. Para darte el mejor consejo, cuéntame un poco más:
• ¿Es sobre alguna molestia física?
• ¿Sobre qué comer o beber?
• ¿Sobre tu ritmo o zonas de entreno?
• ¿Sobre ajustar el plan?
Cuantos más detalles me des, mejor consejo puedo darte.`
}

// ─── SUGGESTED QUESTIONS (shown in UI) ───────────────────────────────────
export const COACH_SUGGESTIONS = [
  '¿Qué debo comer antes de la tirada larga?',
  'Me duele la rodilla, ¿qué hago?',
  '¿Cómo es el ritmo de Zona 2?',
  '¿Puedo mover la tirada larga al domingo?',
  'No tengo ganas de entrenar hoy',
  '¿Cómo planifico la semana de carrera?',
  'Me he saltado 3 días por gripe',
  '¿Qué estrategia uso el día de la carrera?',
]
