// src/utils/hospitalizacionService.ts - VERSIÓN FIREBASE COMPLETA CON PDF
import { 
  EpisodioHospitalizacion, 
  InformeAlta, 
  NotaEvolucion, 
  ResultadoLaboratorio, 
  Procedimiento, 
  Tratamiento,
  SignosVitales,
  EstudioImagen 
} from '../types/hospitalizacion';
import { PacienteData } from '../types/paciente';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from './firebase';
import { PDFService } from './pdfService';

export class HospitalizacionService {
  private collectionName = 'episodios_hospitalizacion';

  // Calcular edad desde Timestamp de Firebase
  private calcularEdad(fechaNacimiento: Timestamp): number {
    const birthDate = fechaNacimiento.toDate();
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Obtener todos los episodios - FIREBASE
  async getEpisodios(): Promise<EpisodioHospitalizacion[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('fecha_ingreso', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertFirestoreData(doc.data())
      })) as EpisodioHospitalizacion[];
    } catch (error) {
      console.error('Error obteniendo episodios:', error);
      return [];
    }
  }

  // Obtener episodios por paciente - FIREBASE
  async getEpisodiosPaciente(pacienteId: string): Promise<EpisodioHospitalizacion[]> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('paciente_id', '==', pacienteId),
        orderBy('fecha_ingreso', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertFirestoreData(doc.data())
      })) as EpisodioHospitalizacion[];
    } catch (error) {
      console.error('Error obteniendo episodios:', error);
      return [];
    }
  }

  // Obtener episodio por ID - FIREBASE
  async getEpisodioById(episodioId: string): Promise<EpisodioHospitalizacion | null> {
    try {
      const docRef = doc(db, this.collectionName, episodioId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...this.convertFirestoreData(data)
        } as EpisodioHospitalizacion;
      }
      console.log('❌ Episodio no encontrado:', episodioId);
      return null;
    } catch (error) {
      console.error('Error obteniendo episodio:', error);
      return null;
    }
  }

  // Admitir paciente - FIREBASE
  async admitirPaciente(datosEpisodio: Omit<EpisodioHospitalizacion, 'id'>): Promise<EpisodioHospitalizacion> {
    try {
      console.log('🔥 Guardando en Firestore...', datosEpisodio);
      
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...datosEpisodio,
        fecha_ingreso: Timestamp.now(),
        fecha_creacion: Timestamp.now(),
        activo: true,
        signos_vitales: datosEpisodio.signos_vitales || [],
        resultados_laboratorio: datosEpisodio.resultados_laboratorio || [],
        estudios_imagen: datosEpisodio.estudios_imagen || [],
        notas_evolucion: datosEpisodio.notas_evolucion || [],
        tratamientos: datosEpisodio.tratamientos || [],
        procedimientos: datosEpisodio.procedimientos || [],
        medicamentos_alta: datosEpisodio.medicamentos_alta || [],
        medicamentos_actuales: datosEpisodio.medicamentos_actuales || [],
        alergias: datosEpisodio.alergias || [],
        antecedentes_medicos: datosEpisodio.antecedentes_medicos || '',
        habitacion: datosEpisodio.habitacion || '',
        cama: datosEpisodio.cama || ''
      });

      const nuevoEpisodio: EpisodioHospitalizacion = {
        ...datosEpisodio,
        id: docRef.id,
        fecha_ingreso: new Date().toISOString()
      };

      console.log('✅ Episodio guardado en Firestore con ID:', docRef.id);
      return nuevoEpisodio;
      
    } catch (error) {
      console.error('❌ Error al guardar en Firestore:', error);
      throw error;
    }
  }

  // Actualizar episodio - FIREBASE
  async actualizarEpisodio(episodioId: string, datosActualizados: Partial<EpisodioHospitalizacion>): Promise<boolean> {
    try {
      const episodioRef = doc(db, this.collectionName, episodioId);
      
      // Convertir fechas string a Timestamp si es necesario
      const datosParaFirestore: any = { ...datosActualizados };
      
      if (datosActualizados.fecha_ingreso && typeof datosActualizados.fecha_ingreso === 'string') {
        datosParaFirestore.fecha_ingreso = Timestamp.fromDate(new Date(datosActualizados.fecha_ingreso));
      }
      
      if (datosActualizados.fecha_alta && typeof datosActualizados.fecha_alta === 'string') {
        datosParaFirestore.fecha_alta = Timestamp.fromDate(new Date(datosActualizados.fecha_alta));
      }
      
      await updateDoc(episodioRef, {
        ...datosParaFirestore,
        fecha_actualizacion: Timestamp.now()
      });
      
      console.log('✅ Episodio actualizado:', episodioId);
      return true;
    } catch (error) {
      console.error('Error actualizando episodio:', error);
      return false;
    }
  }

  // Eliminar episodio - FIREBASE
  async eliminarEpisodio(episodioId: string): Promise<boolean> {
    try {
      // En Firestore normalmente no eliminamos, marcamos como inactivo
      const episodioRef = doc(db, this.collectionName, episodioId);
      
      await updateDoc(episodioRef, {
        activo: false,
        fecha_eliminacion: Timestamp.now()
      });
      
      console.log('✅ Episodio marcado como eliminado:', episodioId);
      return true;
    } catch (error) {
      console.error('Error eliminando episodio:', error);
      return false;
    }
  }

  // DAR DE ALTA PACIENTE - MÉTODO COMPLETO
  async darAltaPaciente(episodioId: string, datosAlta: {
    diagnostico_final: string;
    resumen_alta: string;
    condicion_alta: string;
    instrucciones_seguimiento: string;
    medicamentos_alta: string[];
  }): Promise<boolean> {
    try {
      console.log('🏥 Registrando alta médica para episodio:', episodioId);
      
      const episodioRef = doc(db, this.collectionName, episodioId);
      
      // Verificar que el episodio existe
      const episodioSnap = await getDoc(episodioRef);
      if (!episodioSnap.exists()) {
        console.error('❌ Episodio no encontrado:', episodioId);
        return false;
      }
      
      await updateDoc(episodioRef, {
        diagnostico_final: datosAlta.diagnostico_final,
        resumen_alta: datosAlta.resumen_alta,
        condicion_alta: datosAlta.condicion_alta,
        instrucciones_seguimiento: datosAlta.instrucciones_seguimiento,
        medicamentos_alta: datosAlta.medicamentos_alta,
        fecha_alta: Timestamp.now(),
        activo: false,
        estado: 'Completado',
        fecha_actualizacion: Timestamp.now()
      });
      
      console.log('✅ Alta médica registrada exitosamente para episodio:', episodioId);
      return true;
    } catch (error) {
      console.error('❌ Error dando de alta:', error);
      return false;
    }
  }

  // GENERAR Y DESCARGAR INFORME DE ALTA EN PDF
  async generarInformeAlta(episodioId: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('📄 Generando informe de alta en PDF para episodio:', episodioId);
        
        // Simular delay de generación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const episodio = await this.getEpisodioById(episodioId);
        if (!episodio) {
          throw new Error('Episodio no encontrado');
        }

        const pdf = await PDFService.generarInformeAlta(episodio);
        const pdfBlob = pdf.output('blob');
        
        console.log('✅ PDF generado exitosamente');
        resolve(pdfBlob);
      } catch (error) {
        console.error('❌ Error generando PDF:', error);
        reject(error);
      }
    });
  }

  // DESCARGAR INFORME DE ALTA
  async descargarInformeAlta(episodioId: string, filename: string = 'informe_alta.pdf'): Promise<void> {
    try {
      console.log('💾 Descargando informe de alta...');
      
      const pdfBlob = await this.generarInformeAlta(episodioId);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF descargado exitosamente');
    } catch (error) {
      console.error('❌ Error descargando informe:', error);
      throw error;
    }
  }

  // PREVISUALIZAR INFORME DE ALTA
  async previsualizarInformeAlta(episodioId: string): Promise<void> {
    try {
      console.log('👁️ Previsualizando informe de alta...');
      
      const pdfBlob = await this.generarInformeAlta(episodioId);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      console.log('✅ PDF abierto para previsualización');
    } catch (error) {
      console.error('❌ Error previsualizando informe:', error);
      throw error;
    }
  }

  // Añadir signos vitales - FIREBASE
  async agregarSignosVitales(episodioId: string, signos: Omit<SignosVitales, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevosSignos: SignosVitales = {
          ...signos,
          fecha: new Date().toISOString()
        };
        
        const signosActualizados = [...episodio.signos_vitales, nuevosSignos];
        
        await this.actualizarEpisodio(episodioId, {
          signos_vitales: signosActualizados
        });
      }
    } catch (error) {
      console.error('Error agregando signos vitales:', error);
      throw error;
    }
  }

  // Añadir nota de evolución - FIREBASE
  async agregarNotaEvolucion(episodioId: string, nota: Omit<NotaEvolucion, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevaNota: NotaEvolucion = {
          ...nota,
          fecha: new Date().toISOString()
        };
        
        const notasActualizadas = [...episodio.notas_evolucion, nuevaNota];
        
        await this.actualizarEpisodio(episodioId, {
          notas_evolucion: notasActualizadas
        });
        
        console.log('✅ Nota agregada al episodio:', episodioId);
      }
    } catch (error) {
      console.error('Error agregando nota:', error);
      throw error;
    }
  }

  // Añadir resultado de laboratorio - FIREBASE
  async agregarResultadoLaboratorio(episodioId: string, resultado: Omit<ResultadoLaboratorio, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevoResultado: ResultadoLaboratorio = {
          ...resultado,
          fecha: new Date().toISOString()
        };
        
        const resultadosActualizados = [...episodio.resultados_laboratorio, nuevoResultado];
        
        await this.actualizarEpisodio(episodioId, {
          resultados_laboratorio: resultadosActualizados
        });
      }
    } catch (error) {
      console.error('Error agregando resultado laboratorio:', error);
      throw error;
    }
  }

  // Añadir estudio de imagen - FIREBASE
  async agregarEstudioImagen(episodioId: string, estudio: Omit<EstudioImagen, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevoEstudio: EstudioImagen = {
          ...estudio,
          fecha: new Date().toISOString()
        };
        
        const estudiosActualizados = [...episodio.estudios_imagen, nuevoEstudio];
        
        await this.actualizarEpisodio(episodioId, {
          estudios_imagen: estudiosActualizados
        });
      }
    } catch (error) {
      console.error('Error agregando estudio imagen:', error);
      throw error;
    }
  }

  // Añadir procedimiento - FIREBASE
  async agregarProcedimiento(episodioId: string, procedimiento: Omit<Procedimiento, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevoProcedimiento: Procedimiento = {
          ...procedimiento,
          fecha: new Date().toISOString()
        };
        
        const procedimientosActualizados = [...episodio.procedimientos, nuevoProcedimiento];
        
        await this.actualizarEpisodio(episodioId, {
          procedimientos: procedimientosActualizados
        });
      }
    } catch (error) {
      console.error('Error agregando procedimiento:', error);
      throw error;
    }
  }

  // Añadir tratamiento - FIREBASE
  async agregarTratamiento(episodioId: string, tratamiento: Omit<Tratamiento, 'fecha'>): Promise<void> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (episodio) {
        const nuevoTratamiento: Tratamiento = {
          ...tratamiento,
          fecha: new Date().toISOString()
        };
        
        const tratamientosActualizados = [...episodio.tratamientos, nuevoTratamiento];
        
        await this.actualizarEpisodio(episodioId, {
          tratamientos: tratamientosActualizados
        });
      }
    } catch (error) {
      console.error('Error agregando tratamiento:', error);
      throw error;
    }
  }

  // Generar informe de alta (formato objeto) - FIREBASE
  async generarInformeAltaObjeto(episodioId: string, pacienteData: PacienteData): Promise<InformeAlta | null> {
    try {
      const episodio = await this.getEpisodioById(episodioId);
      
      if (!episodio || !episodio.fecha_alta) return null;

      const fechaIngreso = new Date(episodio.fecha_ingreso);
      const fechaAlta = new Date(episodio.fecha_alta);
      const diasEstancia = Math.ceil((fechaAlta.getTime() - fechaIngreso.getTime()) / (1000 * 3600 * 24));

      const edad = this.calcularEdad(pacienteData.FechaNacimiento);
      const nombreCompleto = `${pacienteData.Nombre} ${pacienteData.Apellido1}${pacienteData.Apellido2 ? ' ' + pacienteData.Apellido2 : ''}`;

      return {
        nombre_hospital: "Hospital Docente Simulación",
        titulo_informe: "INFORME DE ALTA MÉDICA",
        info_paciente: {
          nombre: nombreCompleto,
          id: pacienteData.Id_paciente,
          edad: edad,
          genero: pacienteData.Sexo
        },
        info_episodio: {
          fecha_ingreso: fechaIngreso.toLocaleDateString('es-ES'),
          fecha_alta: fechaAlta.toLocaleDateString('es-ES'),
          dias_estancia: diasEstancia,
          medico_tratante: episodio.medico_tratante,
          departamento: episodio.departamento
        },
        info_clinica: {
          motivo_ingreso: episodio.motivo_ingreso,
          diagnostico_inicial: episodio.diagnostico_inicial,
          diagnostico_final: episodio.diagnostico_final || '',
          procedimientos_realizados: episodio.procedimientos,
          evolucion_hospitalaria: this.generarResumenEvolucion(episodio),
          condicion_alta: episodio.condicion_alta || '',
          medicamentos_alta: episodio.medicamentos_alta,
          instrucciones_seguimiento: episodio.instrucciones_seguimiento || ''
        }
      };
    } catch (error) {
      console.error('Error generando informe de alta:', error);
      return null;
    }
  }

  // Generar historia clínica para paciente - FIREBASE
  async generarHistoriaClinica(pacienteId: string, pacienteData?: PacienteData): Promise<any> {
    try {
      const episodios = await this.getEpisodiosPaciente(pacienteId);
      
      const historiaClinica = {
        paciente: {
          id: pacienteData?.Id_paciente || pacienteId,
          nombre: pacienteData?.Nombre || '',
          apellido: `${pacienteData?.Apellido1 || ''} ${pacienteData?.Apellido2 || ''}`.trim(),
          fechaNacimiento: pacienteData?.FechaNacimiento,
          telefono: pacienteData?.Telefono || '',
          email: '',
          genero: pacienteData?.Sexo || '',
          tipoSangre: '',
          contactoEmergencia: undefined,
          alergias: [],
          enfermedadesCronicas: []
        },
        episodiosHospitalizacion: episodios.map(episodio => ({
          id: episodio.id,
          fecha_ingreso: episodio.fecha_ingreso,
          fecha_alta: episodio.fecha_alta,
          motivo_ingreso: episodio.motivo_ingreso,
          diagnostico_inicial: episodio.diagnostico_inicial,
          diagnostico_final: episodio.diagnostico_final,
          medico_tratante: episodio.medico_tratante,
          departamento: episodio.departamento,
          habitacion: episodio.habitacion,
          cama: episodio.cama,
          procedimientos: episodio.procedimientos,
          notas_evolucion: episodio.notas_evolucion,
          resultados_laboratorio: episodio.resultados_laboratorio,
          estudios_imagen: episodio.estudios_imagen,
          tratamientos: episodio.tratamientos,
          signos_vitales: episodio.signos_vitales
        }))
      };

      return historiaClinica;
    } catch (error) {
      console.error('Error generando historia clínica:', error);
      return null;
    }
  }

  // Obtener estadísticas de hospitalización - FIREBASE
  async obtenerEstadisticas(): Promise<{
    totalEpisodios: number;
    activos: number;
    completados: number;
    porDepartamento: { [key: string]: number };
    promedioEstancia: number;
  }> {
    try {
      const episodios = await this.getEpisodios();
      const activos = episodios.filter(ep => !ep.fecha_alta).length;
      const completados = episodios.filter(ep => ep.fecha_alta).length;
      
      const porDepartamento = episodios.reduce((acc, ep) => {
        const depto = ep.departamento || 'Sin departamento';
        acc[depto] = (acc[depto] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const episodiosCompletados = episodios.filter(ep => ep.fecha_alta);
      const promedioEstancia = episodiosCompletados.length > 0 
        ? episodiosCompletados.reduce((sum, ep) => {
            const ingreso = new Date(ep.fecha_ingreso);
            const alta = new Date(ep.fecha_alta!);
            const dias = Math.ceil((alta.getTime() - ingreso.getTime()) / (1000 * 3600 * 24));
            return sum + dias;
          }, 0) / episodiosCompletados.length
        : 0;

      return {
        totalEpisodios: episodios.length,
        activos,
        completados,
        porDepartamento,
        promedioEstancia: Math.round(promedioEstancia * 10) / 10
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalEpisodios: 0,
        activos: 0,
        completados: 0,
        porDepartamento: {},
        promedioEstancia: 0
      };
    }
  }

  // Buscar episodios por criterios - FIREBASE
  async buscarEpisodios(criterios: {
    pacienteId?: string;
    departamento?: string;
    medico?: string;
    estado?: 'activo' | 'completado';
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<EpisodioHospitalizacion[]> {
    try {
      let episodios = await this.getEpisodios();

      if (criterios.pacienteId) {
        episodios = episodios.filter(ep => ep.paciente_id === criterios.pacienteId);
      }

      if (criterios.departamento) {
        episodios = episodios.filter(ep => ep.departamento === criterios.departamento);
      }

      if (criterios.medico) {
        episodios = episodios.filter(ep => ep.medico_tratante === criterios.medico);
      }

      if (criterios.estado) {
        if (criterios.estado === 'activo') {
          episodios = episodios.filter(ep => !ep.fecha_alta);
        } else {
          episodios = episodios.filter(ep => ep.fecha_alta);
        }
      }

      if (criterios.fechaInicio) {
        episodios = episodios.filter(ep => 
          new Date(ep.fecha_ingreso) >= new Date(criterios.fechaInicio!)
        );
      }

      if (criterios.fechaFin) {
        episodios = episodios.filter(ep => 
          new Date(ep.fecha_ingreso) <= new Date(criterios.fechaFin!)
        );
      }

      return episodios;
    } catch (error) {
      console.error('Error buscando episodios:', error);
      return [];
    }
  }

  // Método para obtener episodios activos - FIREBASE
  async getEpisodiosActivos(): Promise<EpisodioHospitalizacion[]> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('activo', '==', true),
        orderBy('fecha_ingreso', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertFirestoreData(doc.data())
      })) as EpisodioHospitalizacion[];
    } catch (error) {
      console.error('Error obteniendo episodios activos:', error);
      return [];
    }
  }

  // Método para obtener episodios completados - FIREBASE
  async getEpisodiosCompletados(): Promise<EpisodioHospitalizacion[]> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('activo', '==', false),
        orderBy('fecha_alta', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertFirestoreData(doc.data())
      })) as EpisodioHospitalizacion[];
    } catch (error) {
      console.error('Error obteniendo episodios completados:', error);
      return [];
    }
  }

  // Convertir datos de Firestore
  private convertFirestoreData(data: DocumentData): any {
    const converted = { ...data };
    
    // Convertir Timestamps a strings ISO
    if (data.fecha_ingreso?.toDate) {
      converted.fecha_ingreso = data.fecha_ingreso.toDate().toISOString();
    }
    if (data.fecha_alta?.toDate) {
      converted.fecha_alta = data.fecha_alta.toDate().toISOString();
    }
    if (data.fecha_creacion?.toDate) {
      converted.fecha_creacion = data.fecha_creacion.toDate().toISOString();
    }
    if (data.fecha_actualizacion?.toDate) {
      converted.fecha_actualizacion = data.fecha_actualizacion.toDate().toISOString();
    }

    // Asegurar que los arrays existan
    converted.signos_vitales = converted.signos_vitales || [];
    converted.resultados_laboratorio = converted.resultados_laboratorio || [];
    converted.estudios_imagen = converted.estudios_imagen || [];
    converted.notas_evolucion = converted.notas_evolucion || [];
    converted.tratamientos = converted.tratamientos || [];
    converted.procedimientos = converted.procedimientos || [];
    converted.medicamentos_alta = converted.medicamentos_alta || [];
    converted.medicamentos_actuales = converted.medicamentos_actuales || [];
    converted.alergias = converted.alergias || [];

    return converted;
  }

  private generarResumenEvolucion(episodio: EpisodioHospitalizacion): string {
    let resumen = `Paciente ingresó por ${episodio.motivo_ingreso}. `;
    
    if (episodio.notas_evolucion.length > 0) {
      resumen += `Durante su estancia presentó ${episodio.notas_evolucion.length} evoluciones documentadas. `;
    }
    
    if (episodio.procedimientos.length > 0) {
      resumen += `Se realizaron ${episodio.procedimientos.length} procedimientos. `;
    }
    
    if (episodio.resultados_laboratorio.length > 0) {
      resumen += `Se obtuvieron ${episodio.resultados_laboratorio.length} resultados de laboratorio. `;
    }
    
    if (episodio.estudios_imagen.length > 0) {
      resumen += `Se realizaron ${episodio.estudios_imagen.length} estudios de imagen. `;
    }
    
    resumen += `Evolución final: ${episodio.resumen_alta || 'Sin resumen de evolución'}`;
    
    return resumen;
  }

  // Método específico para la historia clínica - ACTUALIZADO
  async obtenerEpisodiosPorPaciente(pacienteId: string): Promise<EpisodioHospitalizacion[]> {
    return this.getEpisodiosPaciente(pacienteId);
  }

  // Crear datos de prueba - FIREBASE
  async crearDatosPrueba(): Promise<void> {
    try {
      console.log('📝 Creando datos de prueba en Firestore...');
      
      // Crear episodio de prueba
      const episodioPrueba = {
        paciente_id: '1',
        fecha_ingreso: Timestamp.fromDate(new Date('2024-01-15')),
        fecha_alta: Timestamp.fromDate(new Date('2024-01-20')),
        medico_tratante: 'Dr. García',
        departamento: 'Medicina Interna',
        motivo_ingreso: 'Fiebre alta persistente',
        diagnostico_inicial: 'Sospecha de infección bacteriana',
        diagnostico_final: 'Infección urinaria complicada',
        habitacion: '201',
        cama: 'A',
        antecedentes_medicos: 'Hipertensión controlada',
        medicamentos_actuales: [],
        alergias: ['Penicilina'],
        signos_vitales: [],
        resultados_laboratorio: [],
        estudios_imagen: [],
        notas_evolucion: [],
        tratamientos: [],
        procedimientos: [],
        medicamentos_alta: ['Amoxicilina 500mg cada 8h por 7 días'],
        resumen_alta: 'Paciente evolucionó favorablemente con tratamiento antibiótico',
        condicion_alta: 'Bueno',
        instrucciones_seguimiento: 'Control en 7 días',
        activo: false,
        fecha_creacion: Timestamp.now()
      };

      await addDoc(collection(db, this.collectionName), episodioPrueba);
      console.log('✅ Datos de prueba creados en Firestore');
    } catch (error) {
      console.error('Error creando datos de prueba:', error);
    }
  }

  // Método para debug - ver todos los episodios
  async debugEpisodios(): Promise<void> {
    try {
      const episodios = await this.getEpisodios();
      console.log('🔍 Debug - Episodios en Firestore:', episodios);
    } catch (error) {
      console.error('Error en debug:', error);
    }
  }
}

// Al final del archivo hospitalizacionService.ts, después de la clase
export const hospitalizacionService = new HospitalizacionService();