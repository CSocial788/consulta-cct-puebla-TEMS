document.getElementById('searchBtn').addEventListener('click', consultarCCT);

document.getElementById('cctInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    consultarCCT();
  }
});

// Función para transformar la fecha y poner el "de" en minúsculas
function formatearFecha(fechaStr) {
  if (!fechaStr || fechaStr === 'Por confirmar') return 'Por confirmar';
  
  let fechaObj = new Date(fechaStr);
  
  if (isNaN(fechaObj.getTime())) {
    return fechaStr; 
  }

  const opciones = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  let fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
  
  return fechaFormateada
    .replace(/\b[a-z]/g, letra => letra.toUpperCase())
    .replace(/\bDe\b/g, 'de');
}

// Función para limpiar la hora (quita segundos y ajusta a a.m./p.m.)
function formatearHora(horaStr) {
  if (!horaStr || horaStr === 'Por confirmar') return 'Por confirmar';
  
  let horaLimpia = horaStr.trim();

  // Intenta detectar formato 24 horas (ej. "14:30" o "14:30:00")
  let partes24 = horaLimpia.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (partes24) {
    let h = parseInt(partes24[1], 10);
    let m = partes24[2];
    let sufijo = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12 || 12;
    return `${h}:${m} ${sufijo}`;
  }

  // Si ya viene en formato 12 horas (ej. "9:00:00 AM" o "9:00 AM")
  return horaLimpia
    .replace(/:00\s*/, ' ') // Quita los segundos si vienen como :00
    .replace(/AM/gi, 'a.m.')
    .replace(/PM/gi, 'p.m.')
    .replace(/\s+/g, ' ');
}

async function consultarCCT() {
  const inputRaw = document.getElementById('cctInput').value;
  const resultDiv = document.getElementById('result');
  const animacionDiv = document.querySelector('.animacion-container');
  
  resultDiv.innerHTML = '';

  const cctBuscada = inputRaw.trim().replace(/\s+/g, '').toUpperCase();

  if (cctBuscada === '') {
    resultDiv.innerHTML = '<p style="color:red; font-weight:bold;">Por favor, ingresa una CCT válida.</p>';
    return;
  }

  // Oculta la animación al realizar la consulta
  if (animacionDiv) {
    animacionDiv.style.display = 'none';
  }

  resultDiv.innerHTML = '<p style="color:#666;">Buscando información...</p>';

  try {
    const response = await fetch('datos.json');
    
    if (!response.ok) {
      throw new Error(`No se pudo cargar el archivo datos.json (Status: ${response.status})`);
    }

    const escuelas = await response.json();

    // Búsqueda por CCT
    const resultado = escuelas.find(item => {
      const claveCCT = item.CCT || item.cct;
      if (!claveCCT) return false;
      return String(claveCCT).trim().replace(/\s+/g, '').toUpperCase() === cctBuscada;
    });

    if (resultado) {
      const cct = resultado.CCT || cctBuscada;
      const nombreEscuela = resultado.Nombre_Escuela || 'No especificado';
      const municipio = resultado.Municipio || 'No especificado';
      
      const fechaBruta = resultado.Fecha || resultado.Fecha_Asamblea || 'Por confirmar';
      const fecha = formatearFecha(fechaBruta);
      
      const horaBruta = resultado.Hora || resultado.Hora_Asamblea || 'Por confirmar';
      const hora = formatearHora(horaBruta);
      
      const sede = resultado.Sede ? resultado.Sede.trim() : 'No especificada';
      const direccion = resultado.Dirección || resultado.Direccion || 'No especificada';

      resultDiv.innerHTML = `
        <div style="border: 2px solid #103923; padding: 20px; border-radius: 8px; background-color: #f0fdf4; margin-top: 15px;">
          <h3 style="color: #691c32; margin-top: 0; font-weight: 700;">${nombreEscuela}</h3>
          <p><strong>CCT:</strong> ${cct}</p>
          <p><strong>Municipio:</strong> ${municipio}</p>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p><strong>Sede:</strong> ${sede}</p>
          <p><strong>Dirección:</strong> ${direccion}</p>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div style="border: 1px solid #d32f2f; padding: 15px; border-radius: 6px; background-color: #ffebee; color: #c62828; margin-top: 15px;">
          No se encontró información programada para la CCT: <strong>${cctBuscada}</strong>.
        </div>
      `;
    }
  } catch (error) {
    console.error('Error durante la consulta:', error);
    resultDiv.innerHTML = `
      <div style="border: 1px solid #d32f2f; padding: 15px; border-radius: 6px; background-color: #ffebee; color: #c62828; margin-top: 15px;">
        <strong>Error de lectura:</strong> Revisa el archivo <code>datos.json</code>.
      </div>
    `;
  }
}
