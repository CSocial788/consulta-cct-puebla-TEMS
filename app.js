document.getElementById('searchBtn').addEventListener('click', consultarCCT);

document.getElementById('cctInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    consultarCCT();
  }
});

// Función para transformar la fecha a formato largo en español
function formatearFecha(fechaStr) {
  if (!fechaStr || fechaStr === 'Por confirmar') return 'Por confirmar';
  
  // Intenta limpiar y leer la fecha
  let fechaObj = new Date(fechaStr);
  
  // Si viene en formato numérico tipo MM/DD/YY o YYYY-MM-DD
  if (isNaN(fechaObj.getTime())) {
    return fechaStr; // Si no la reconoce, la deja como viene original
  }

  const opciones = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  let fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
  
  // Capitaliza la primera letra del mes y ajusta el formato "17 de noviembre de 2026" a "17 de Noviembre de 2026"
  return fechaFormateada.replace(/\b[a-z]/g, letra => letra.toUpperCase());
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
      
      // Aplica el formato de fecha limpio
      const fechaBruta = resultado.Fecha || resultado.Fecha_Asamblea || 'Por confirmar';
      const fecha = formatearFecha(fechaBruta);
      
      const hora = resultado.Hora || resultado.Hora_Asamblea || 'Por confirmar';
      const sede = resultado.Sede ? resultado.Sede.trim() : 'No especificada';
      const direccion = resultado.Dirección || resultado.Direccion || 'No especificada';

      resultDiv.innerHTML = `
        <div style="border: 2px solid #103923; padding: 20px; border-radius: 8px; background-color: #f0fdf4; margin-top: 15px;">
          <h3 style="color: #AD841F; margin-top: 0; font-weight: 700;">${nombreEscuela}</h3>
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
