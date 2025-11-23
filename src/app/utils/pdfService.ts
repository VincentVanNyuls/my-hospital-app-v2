import jsPDF from 'jspdf';
import { UrgenciaData, PacienteData } from './types';

export class PDFService {
  static async generarInformeUrgencia(
    urgencia: UrgenciaData, 
    paciente: PacienteData
  ): Promise<jsPDF> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Configuración inicial
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 102);

    // Encabezado
    pdf.text('INFORME DE URGENCIAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Línea separadora
    pdf.setDrawColor(0, 51, 102);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información del hospital
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('HOSPITAL DOCENCIA SIMULACIÓN', margin, yPosition);
    pdf.text('Servicio de Urgencias', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 15;

    // Información del paciente
    yPosition = this.agregarSeccion(pdf, 'INFORMACIÓN DEL PACIENTE', margin, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    const infoPaciente = [
      `Nombre: ${paciente.Nombre} ${paciente.Apellido1} ${paciente.Apellido2 || ''}`,
      `DNI/NIE: ${paciente.DNI_NIE}`,
      `SIP: ${paciente.SIP}`,
      `NHC: ${paciente.NumHistoriaClinica}`,
      `Edad: ${this.calcularEdad(paciente.FechaNacimiento)} años`,
      `Sexo: ${paciente.Sexo}`
    ];

    yPosition = this.agregarLineas(pdf, infoPaciente, margin, yPosition, 6);
    yPosition += 10;

    // Información de la urgencia
    yPosition = this.agregarSeccion(pdf, 'DATOS DE LA URGENCIA', margin, yPosition);
    yPosition += 5;

    const datosUrgencia = [
      `ID Urgencia: ${urgencia.Id_Urgencia}`,
      `Fecha Entrada: ${this.formatFecha(urgencia.Fecha_entrada)}`,
      `Hora Entrada: ${urgencia.Hora_Entrada}`,
      `Cobertura SS: ${urgencia.Cobertura_SS}`,
      `Tipo Acreditación: ${urgencia.Tipo_Acreditacion}`,
      `Especialidad: ${urgencia.Especialidad}`,
      `Médico Responsable: ${urgencia.Medico_responsable}`,
      `Estado: ${urgencia.Estado.toUpperCase()}`
    ];

    // Agregar datos de salida si existen
    if (urgencia.Fecha_salida) {
      datosUrgencia.push(`Fecha Salida: ${this.formatFecha(urgencia.Fecha_salida)}`);
    }
    if (urgencia.Hora_salida) {
      datosUrgencia.push(`Hora Salida: ${urgencia.Hora_salida}`);
    }

    yPosition = this.agregarLineas(pdf, datosUrgencia, margin, yPosition, 6);
    yPosition += 10;

    // Datos clínicos
    yPosition = this.agregarSeccion(pdf, 'DATOS CLÍNICOS', margin, yPosition);
    yPosition += 5;

    // Motivo de urgencia
    if (urgencia.Motivo_Urgencia && urgencia.Motivo_Urgencia !== 'Por determinar') {
      yPosition = this.agregarSubseccion(pdf, 'Motivo de Urgencia:', margin, yPosition);
      const motivoLines = this.splitTextToSize(pdf, urgencia.Motivo_Urgencia, pageWidth - 2 * margin);
      yPosition = this.agregarLineas(pdf, motivoLines, margin + 5, yPosition, 5);
      yPosition += 5;
    }

    // Lesión/Diagnóstico
    if (urgencia.Lesion) {
      yPosition = this.agregarSubseccion(pdf, 'Lesión/Diagnóstico:', margin, yPosition);
      const lesionLines = this.splitTextToSize(pdf, urgencia.Lesion, pageWidth - 2 * margin);
      yPosition = this.agregarLineas(pdf, lesionLines, margin + 5, yPosition, 5);
      yPosition += 5;
    }

    // Entidad nosológica
    if (urgencia.Entidad) {
      yPosition = this.agregarSubseccion(pdf, 'Entidad Nosológica:', margin, yPosition);
      const entidadLines = this.splitTextToSize(pdf, urgencia.Entidad, pageWidth - 2 * margin);
      yPosition = this.agregarLineas(pdf, entidadLines, margin + 5, yPosition, 5);
      yPosition += 5;
    }

    // Información de alta (si aplica)
    if (urgencia.Estado === 'alta') {
      yPosition = this.agregarSeccion(pdf, 'INFORMACIÓN DEL ALTA', margin, yPosition);
      yPosition += 5;

      const infoAlta = [];
      if (urgencia.Destino) {
        infoAlta.push(`Destino: ${urgencia.Destino}`);
      }
      if (urgencia.Motivo_alta) {
        infoAlta.push(`Motivo del Alta: ${urgencia.Motivo_alta}`);
      }
      if (urgencia.Fecha_alta) {
        infoAlta.push(`Fecha Alta: ${this.formatFecha(urgencia.Fecha_alta)}`);
      }

      if (infoAlta.length > 0) {
        yPosition = this.agregarLineas(pdf, infoAlta, margin, yPosition, 6);
        yPosition += 10;
      }
    }

    // Duración de la urgencia (si tiene datos de salida)
    if (urgencia.Fecha_salida && urgencia.Hora_salida) {
      const duracion = this.calcularDuracionUrgencia(urgencia);
      yPosition = this.agregarSeccion(pdf, 'RESUMEN', margin, yPosition);
      yPosition += 5;
      
      pdf.text(`Duración total de la atención: ${duracion}`, margin, yPosition);
      yPosition += 10;
    }

    // Pie de página
    this.agregarPiePagina(pdf, pageWidth);

    return pdf;
  }

  static async generarInformeAlta(episodio: any): Promise<jsPDF> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Configuración inicial
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 102);

    // Encabezado
    pdf.text('INFORME DE ALTA HOSPITALARIA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Línea separadora
    pdf.setDrawColor(0, 51, 102);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Información del hospital
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('HOSPITAL DOCENCIA SIMULACIÓN', margin, yPosition);
    pdf.text('Servicio de Hospitalización', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 20;

    // Información del paciente
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 51, 102);
    pdf.text('INFORMACIÓN DEL PACIENTE', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    const infoPaciente = [
      `Nombre: ${episodio.paciente_nombre || 'No disponible'}`,
      `ID Paciente: ${episodio.paciente_id || 'No disponible'}`,
      `Edad: ${episodio.paciente_edad || 'No disponible'} años`,
      `Género: ${episodio.paciente_genero || 'No disponible'}`
    ];

    yPosition = this.agregarLineas(pdf, infoPaciente, margin, yPosition, 6);
    yPosition += 10;

    // Información del episodio
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 51, 102);
    pdf.text('INFORMACIÓN DEL EPISODIO', margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const infoEpisodio = [
      `Fecha Ingreso: ${this.formatFecha(episodio.fecha_ingreso)}`,
      `Fecha Alta: ${this.formatFecha(episodio.fecha_alta)}`,
      `Médico Tratante: ${episodio.medico_tratante || 'No disponible'}`,
      `Departamento: ${episodio.departamento || 'No disponible'}`,
      `Habitación: ${episodio.habitacion || 'No disponible'}`,
      `Cama: ${episodio.cama || 'No disponible'}`
    ];

    yPosition = this.agregarLineas(pdf, infoEpisodio, margin, yPosition, 6);
    yPosition += 10;

    // Diagnósticos
    if (episodio.diagnostico_inicial || episodio.diagnostico_final) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 51, 102);
      pdf.text('DIAGNÓSTICOS', margin, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const diagnosticos = [];
      if (episodio.diagnostico_inicial) {
        diagnosticos.push(`Diagnóstico Inicial: ${episodio.diagnostico_inicial}`);
      }
      if (episodio.diagnostico_final) {
        diagnosticos.push(`Diagnóstico Final: ${episodio.diagnostico_final}`);
      }

      yPosition = this.agregarLineas(pdf, diagnosticos, margin, yPosition, 6);
      yPosition += 10;
    }

    // Resumen y seguimiento
    if (episodio.resumen_alta || episodio.instrucciones_seguimiento) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 51, 102);
      pdf.text('RESUMEN Y SEGUIMIENTO', margin, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      if (episodio.resumen_alta) {
        const resumenLines = this.splitTextToSize(pdf, `Resumen del Alta: ${episodio.resumen_alta}`, pageWidth - 2 * margin);
        yPosition = this.agregarLineas(pdf, resumenLines, margin, yPosition, 5);
        yPosition += 5;
      }

      if (episodio.instrucciones_seguimiento) {
        const seguimientoLines = this.splitTextToSize(pdf, `Instrucciones: ${episodio.instrucciones_seguimiento}`, pageWidth - 2 * margin);
        yPosition = this.agregarLineas(pdf, seguimientoLines, margin, yPosition, 5);
        yPosition += 5;
      }
    }

    // Medicamentos al alta
    if (episodio.medicamentos_alta && episodio.medicamentos_alta.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 51, 102);
      pdf.text('MEDICAMENTOS AL ALTA', margin, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      episodio.medicamentos_alta.forEach((medicamento: string, index: number) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${medicamento}`, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Pie de página
    this.agregarPiePagina(pdf, pageWidth);

    return pdf;
  }

  private static agregarSeccion(pdf: jsPDF, titulo: string, x: number, y: number): number {
    // Verificar si necesitamos nueva página
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 51, 102);
    pdf.text(titulo, x, y);
    pdf.setDrawColor(0, 51, 102);
    pdf.line(x, y + 2, x + 50, y + 2);
    
    return y + 10;
  }

  private static agregarSubseccion(pdf: jsPDF, titulo: string, x: number, y: number): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(titulo, x, y);
    return y + 5;
  }

  private static agregarLineas(pdf: jsPDF, lineas: string[], x: number, y: number, lineHeight: number): number {
    let currentY = y;

    for (const linea of lineas) {
      // Verificar si necesitamos nueva página
      if (currentY > 270) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.text(linea, x, currentY);
      currentY += lineHeight;
    }

    return currentY;
  }

  private static splitTextToSize(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = pdf.getTextWidth(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private static agregarPiePagina(pdf: jsPDF, pageWidth: number): void {
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Generado el ${this.formatFecha(new Date())} - Sistema de Gestión Hospitalaria`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  private static formatFecha(fecha: any): string {
    try {
      if (fecha?.toDate) {
        // Es un Timestamp de Firestore
        return fecha.toDate().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (fecha instanceof Date) {
        // Es un objeto Date
        return fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (typeof fecha === 'string') {
        // Es un string ISO
        const dateObj = new Date(fecha);
        return dateObj.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return 'Fecha no disponible';
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  private static calcularEdad(fechaNacimiento: any): number {
    if (!fechaNacimiento) return 0;
    try {
      const nacimiento = fechaNacimiento.toDate();
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch (error) {
      return 0;
    }
  }

  private static calcularDuracionUrgencia(urgencia: UrgenciaData): string {
    try {
      if (!urgencia.Fecha_salida || !urgencia.Hora_salida) {
        return 'En curso';
      }

      const entrada = new Date(urgencia.Fecha_entrada.toDate());
      const [horasEntrada, minutosEntrada] = urgencia.Hora_Entrada.split(':').map(Number);
      entrada.setHours(horasEntrada, minutosEntrada, 0, 0);

      const salida = new Date(urgencia.Fecha_salida.toDate());
      const [horasSalida, minutosSalida] = urgencia.Hora_salida.split(':').map(Number);
      salida.setHours(horasSalida, minutosSalida, 0, 0);

      const diffMs = salida.getTime() - entrada.getTime();
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${diffHoras}h ${diffMinutos}m`;
    } catch (error) {
      return 'Error en cálculo';
    }
  }

  // Método para descargar el PDF directamente
  static async generarYDescargarInformeUrgencia(
    urgencia: UrgenciaData, 
    paciente: PacienteData
  ): Promise<void> {
    try {
      const pdf = await this.generarInformeUrgencia(urgencia, paciente);
      const fileName = `Urgencia_${urgencia.Id_Urgencia}_${paciente.DNI_NIE}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF de urgencia:', error);
      throw error;
    }
  }

  // Método para descargar informe de alta
  static async generarYDescargarInformeAlta(episodio: any): Promise<void> {
    try {
      const pdf = await this.generarInformeAlta(episodio);
      const fileName = `Alta_${episodio.paciente_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF de alta:', error);
      throw error;
    }
  }
}