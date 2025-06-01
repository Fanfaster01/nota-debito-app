// src/utils/dateUtils.ts
import { addDays, format } from 'date-fns';

/**
 * Función auxiliar para manejar el problema de zonas horarias con las fechas
 * Compensa el problema de zona horaria agregando un día a la fecha
 */
export const formatearFecha = (fecha: Date | string | undefined | null): string => {
  if (!fecha) return '-';
  
  // Si es un string, convertir a Date
  let fechaObj: Date;
  if (typeof fecha === 'string') {
    fechaObj = new Date(fecha);
  } else {
    fechaObj = fecha;
  }
  
  // Compensamos el problema de zona horaria añadiendo un día
  const fechaCorregida = addDays(fechaObj, 1);
  
  return format(fechaCorregida, 'dd/MM/yyyy');
};

/**
 * Obtiene la fecha ISO sin la porción de tiempo
 * Útil para los inputs de tipo date
 */
export const getISODateString = (fecha: Date | null): string => {
  if (!fecha) return '';
  return fecha.toISOString().split('T')[0];
};