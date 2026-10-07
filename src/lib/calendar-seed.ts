import type { CalFormat, CalPost, CalStatus } from "./calendar-types";

// Contenido inicial del plan (junio a diciembre 2026).
// Cada fila es [día, formato, estado, texto]; la clave es marca|canal|mes.
type Row = [number, CalFormat, CalStatus, string];

const Q = (d: number, s: CalStatus): Row => [d, "H", s, "3 cuotas sin interés"];

const DATA: Record<string, Row[]> = {
"aruma|org|6": [
[15,"C",2,"Promo mundial"],[16,"H",2,"1er partido mundial"],[17,"H",2,"Promo mundial"],[18,"C",2,"Jgo Fortaleza"],
[19,"R",0,"Col Mora: presentación. Se graba el 16/06 y se edita el 17/06"],[20,"H",2,"Día de la bandera"],[21,"H",2,"Día del padre"],
[22,"H",2,"2do partido mundial"],[23,"C",0,"Contenido educativo por definir. Falta enviar tarea a Xime"],[25,"C",2,"Jgo Iron"],
[26,"R",0,"Reel 4: por definir. Se graba el 23/06 y se edita el 24/06. Falta guion"],[27,"H",2,"3er partido mundial"],
[30,"C",2,"Col Fortaleza"],[30,"R",0,"Reel 5, video historia: presentación Apoyalito. Falta enviar tarea a Elbio"]
],
"aruma|org|7": [
Q(1,2),[3,"R",2,"Reel presentando Apoyalito"],[4,"H",2,"16 avos mundial"],[7,"H",2,"Día internacional del chocolate"],
[8,"C",2,"Qué tela usamos en nuestros colchones (explicar tela de jacquard)"],[10,"R",2,"Argentinizando lenguaje colchonero"],
Q(15,2),[15,"C",2,"Qué es un colchón híbrido (mostrar Mac). Entrega martes 14/07"],[19,"H",0,"FINAL mundial"],[20,"H",2,"Día del amigo"],
[21,"C",2,"Pets (todas las camitas). Entrega lunes 20/07"],[21,"H",2,"Día del perro"],Q(22,2),
[24,"R",0,"La importancia de dormir 8 horas (ref. Daniel Bilbao)"],[26,"H",2,"Día de los abuelos"],
[28,"C",2,"Para qué sirven los paneles acústicos. Entrega lunes 27/07"],Q(29,2),
[31,"R",0,"1 día conmigo en el local (explicando todo lo que hacés)"]
],
"aruma|org|8": [
Q(5,2),[6,"C",2,"Cómo dominar el arte de dormir 8 horas por día"],[7,"R",2,"La importancia de dormir 8 horas (ref. Daniel Bilbao)"],
Q(8,2),[8,"H",2,"Día del gato"],Q(12,2),[13,"C",2,"Señales de que tu colchón ya murió"],[14,"R",2,"Reel non flip"],Q(15,2),[16,"H",2,"Día del niño"],
Q(19,2),[20,"C",2,"Cuánto cuesta dormir mal por año"],[21,"R",0,"1 día conmigo en el local (explicando todo lo que hacés)"],Q(22,2),
Q(26,2),[27,"C",2,"Por qué te despertás de madrugada sin razón"],[28,"R",0,"Subir 1 reel ya grabado de paneles acústicos"],Q(29,2)
],
"aruma|org|9": [
Q(2,2),[3,"C",2,"Cuántas horas de sueño necesitás según tu edad"],[4,"R",0,"Colchón Roll"],[4,"R",0,"Mito de “esto es solo para estudios profesionales”"],
Q(5,2),Q(9,2),[10,"C",2,"Tu pareja arruina tu sueño sin querer"],[11,"R",0,"Mito de “mejora el sonido de la grabación”"],Q(12,2),
Q(16,2),[17,"C",2,"El error más común al comprar un colchón"],[18,"R",0,"Mito de firmeza y dolor de espalda"],Q(19,2),
[21,"H",2,"Día de la primavera"],Q(23,2),[24,"C",2,"POV: elegís un colchón y no sabés nada"],[25,"R",0,"Mito de “firme = tabla, sin acolchado”"],
Q(26,2),[29,"R",0,"Top Killer 1"],Q(30,2)
],
"aruma|org|10": [
[1,"C",2,"Camas perros"],[1,"H",2,"Camas perros"],[1,"C",2,"Por qué dormís mejor en hotel"],[2,"R",0,"1. Cama perros"],[2,"R",0,"Instalación sin dañar la pared"],
Q(3,2),[4,"H",2,"Día del animal"],[5,"C",2,"Carrusel 1"],[6,"R",0,"Top Killer 2"],Q(7,2),[9,"R",0,"2. Amamantar"],Q(10,2),
[12,"C",2,"Carrusel 2"],[13,"R",0,"Top Killer 3"],Q(14,2),[15,"C",2,"ALM amamantar"],[15,"H",2,"ALM amamantar"],[16,"R",0,"3. Amamantar 2"],
Q(17,2),[18,"H",2,"Día de la madre"],[19,"C",2,"Carrusel 3"],[20,"R",0,"Top Killer 4"],Q(21,2),[23,"R",0,"4. Cama perro 2"],Q(24,2),
[26,"C",2,"Carrusel 4"],[27,"R",0,"Top Killer 5"],Q(28,2),[30,"R",0,"5. Amamantar 3"],Q(31,2),[31,"H",2,"Halloween"]
],
"aruma|org|11": [
[2,"R",0,"Cyber Monday"],[3,"R",0,"Top Killer 6"],Q(4,2),[5,"C",0,"Respaldos"],[5,"H",0,"Respaldos"],[6,"R",0,"1. General resp"],
Q(7,2),[9,"C",0,"Carrusel 5"],[10,"R",0,"Top Killer 7"],Q(11,2),[13,"R",0,"2. Amamantar 4"],Q(14,2),[16,"C",0,"Carrusel 6"],
[17,"R",0,"Top Killer 8"],Q(18,2),[20,"R",0,"3. Amamantar 5"],Q(21,2),[23,"C",0,"Carrusel 7"],[24,"R",0,"Top Killer 9"],Q(25,2),
[27,"R",0,"4. Black Friday"],Q(28,2),[30,"C",0,"Carrusel 8"]
],
"aruma|org|12": [
[1,"R",0,"Top Killer 10"],Q(2,0),[3,"C",0,"Respaldos"],[3,"H",0,"Camas perros"],[4,"R",0,"General nuevos"],Q(5,0),[7,"C",0,"Carrusel 9"],
[8,"R",0,"Top Killer 11"],Q(9,0),[10,"R",0,"Día del animal (Día Internacional de los Derechos de los Animales)"],Q(12,0),[14,"C",0,"Carrusel 10"],
[15,"R",0,"Presentación ALM corderito"],Q(16,0),[17,"C",0,"ALM corderito"],[17,"H",0,"ALM corderito"],[18,"R",0,"Storytelling"],Q(19,0),
[21,"R",0,"21 de diciembre"],[22,"C",0,"Carrusel 11"],Q(23,0),[23,"R",0,"Colchón Santa"],[24,"H",0,"Feliz Navidad"],Q(26,0),[28,"R",0,"Top Killer 12"],[29,"C",0,"Carrusel 12"],[31,"R",0,"Fin de año"],[31,"H",0,"Feliz año"]
],
"aruma|ads|7": [
[14,"R",0,"Entrega de 6 reels. Elbio debe entregarlos este día. Pauta apagada el 13/07"],[17,"R",0,"Publicar los 6 reels en Meta Ads. Moisés debe tenerlos listos el 16/07 (día de edición)"]
],
"softline|org|6": [
[15,"C",2,"Promo mundial"],[16,"H",2,"1er partido mundial"],[17,"H",2,"Promo mundial"],[18,"C",2,"Jgo Atenas"],[19,"R",2,"Cuándo cambiar tu colchón"],
[20,"H",2,"Día de la bandera"],[21,"H",2,"Día del padre"],[22,"H",2,"2do partido mundial"],[23,"C",0,"Contenido educativo por definir. Falta enviar tarea a Xime"],
[25,"C",2,"Promo Lyon"],[26,"R",0,"Por definir. Se graba el 23/06 y se edita el 24/06. Falta guion"],[27,"H",2,"3er partido mundial"],
[30,"C",0,"Col Atenas. Falta enviar a Xime"],[30,"H",0,"Video historia: presentación Apoyalito. Falta enviar tarea a Fer"]
],
"softline|org|7": [
Q(1,2),[3,"R",2,"Apoyalito. Solo hay que ir a grabar"],[3,"H",2,"16 avos mundial"],[6,"H",0,"8 avos mundial"],[7,"H",2,"Día internacional del chocolate"],
[9,"C",2,"Presentando Apoyalito piqué. Entregable miércoles 08/07"],[10,"R",2,"Presentar al equipo de la fábrica"],[10,"H",0,"4tos mundial"],
[14,"H",0,"Semis mundial"],Q(15,2),[16,"C",2,"Argentinizando lenguaje colchonero. Entregable martes 14/07"],[17,"R",0,"Reel pauta: colchón hospitalario (ver apuntes cuaderno)"],
[19,"H",0,"FINAL mundial"],[20,"H",2,"Día del amigo"],[21,"C",2,"Lo que ganás si dormís 8 horas (no contarlo como dejar de fumar). Entregable lunes 20/07"],
Q(22,2),[24,"R",0,"Reel en casa de Fer. Solo hay que ir a grabar"],[26,"H",2,"Día de los abuelos"],[28,"C",2,"Presentación almohada visco. Entregable lunes 27/07"],
Q(29,2),[30,"C",0,"Colchón hospitalario. Falta enviar tarea a Xime"],[31,"R",0,"Tipo de tela (jacquard vs piqué): cómo se sienten"],
[31,"R",0,"Fer explicando cómo se fabrica un colchón mientras lo fabrican"]
],
"softline|org|8": [
Q(5,2),[6,"C",2,"Colchón hospitalario"],[7,"R",2,"Reel ya grabado tofu: colchón hospitalario"],Q(8,2),Q(12,2),[13,"C",2,"Presentación colchón Grecia"],
[14,"R",2,"Apoya rodillas"],Q(15,2),[16,"H",2,"Día del niño"],Q(19,2),[20,"C",2,"Presentación colchón Tokyo"],
[21,"R",2,"Tipo de tela (jacquard vs piqué): cómo se sienten"],Q(22,2),Q(26,2),[27,"C",2,"Apoyalito desde otro ángulo"],
[28,"R",2,"Fer reaccionando al video de la espuma con bidón de agua"],Q(29,2)
],
"softline|org|9": [
Q(2,2),[4,"R",0,"Fer reaccionando a la espuma con bidón de agua"],Q(5,2),Q(9,2),[10,"C",0,"1. Dormir más y trabajar mejor"],
[11,"R",0,"Fer Q&A en Plaza de Lomas"],Q(12,2),Q(16,2),[17,"C",0,"2. Existe un colchón que no se moja por dentro"],
[18,"R",0,"Fer explicando cómo se fabrica un colchón mientras lo fabrican"],Q(19,2),[21,"H",0,"Día de la primavera"],Q(23,2),
[24,"C",0,"3. Por qué en clínicas usan otro colchón"],[25,"R",0,"Cargar un flete con voz de Fer de fondo"],Q(26,2),Q(30,2)
],
"softline|org|10": [
[1,"C",0,"4. Lo que un colchón necesita para cuidar mejor"],[2,"C",0,"El colchón que combina dos mundos"],Q(3,0),[5,"C",0,"Carrusel 1"],
Q(7,0),Q(10,0),[12,"C",0,"Carrusel 2"],Q(14,0),Q(17,0),[18,"H",0,"Día de la madre"],[19,"C",0,"Carrusel 3"],Q(21,0),Q(24,0),
[26,"C",0,"Carrusel 4"],Q(28,0),Q(31,0),[31,"H",0,"Noche de brujas"]
],
"softline|org|11": [
[2,"R",0,"Cyber Monday"],[2,"C",0,"Carrusel especial cyber"],Q(4,0),Q(7,0),[9,"C",0,"Carrusel 5"],Q(11,0),Q(14,0),
[16,"C",0,"Carrusel 6"],Q(18,0),Q(21,0),[23,"C",0,"Carrusel 7"],Q(25,0),Q(28,0),[30,"C",0,"Carrusel 8"]
],
"softline|org|12": [
Q(2,0),Q(5,0),[7,"C",0,"Carrusel 9"],Q(9,0),Q(12,0),[14,"C",0,"Carrusel 10"],Q(16,0),Q(19,0),[22,"C",0,"Carrusel 11"],Q(23,0),
[24,"H",0,"Feliz Navidad"],Q(26,0),[29,"C",0,"Carrusel 12"],[31,"H",0,"Feliz año"]
],
"softline|ads|7": [
[21,"R",0,"Entrega de 6 reels. Fer y Moi deben grabar este día. Pauta apagada el 20/07"],[24,"R",0,"Publicar los 6 reels en Meta Ads. Moisés debe tenerlos listos el 23/07 (día de edición)"]
]
};

export function buildSeed(): CalPost[] {
  const out: CalPost[] = [];
  Object.entries(DATA).forEach(([key, rows]) => {
    const [brand, channel, month] = key.split("|");
    rows.forEach(([day, format, status, text], i) => {
      out.push({
        id: `seed:${key}:${i}`,
        brand: brand as CalPost["brand"],
        channel: channel as CalPost["channel"],
        month: Number(month),
        day,
        format,
        status,
        text,
      });
    });
  });
  return out;
}
