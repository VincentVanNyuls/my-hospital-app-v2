// src/app/hospitalizacion/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HospitalAdmission } from '../types/hospitalizacion'; // Ruta CORRECTA
import { HospitalizationService } from '../utils/hospitalizacionService'; // Ruta CORRECTA

export default function HospitalizacionPage() {
  const [activeAdmissions, setActiveAdmissions] = useState<HospitalAdmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveAdmissions();
  }, []);

  const loadActiveAdmissions = async () => {
    try {
      const admissions = await HospitalizationService.getActiveAdmissions();
      setActiveAdmissions(admissions);
    } catch (error) {
      console.error('Error loading admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Hospitalización</h1>
        <Link
          href="/hospitalizacion/admitir"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Ingresar Paciente
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Ingresos Activos</h3>
          <p className="text-3xl font-bold text-blue-600">{activeAdmissions.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Cuidados Diarios</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Altas del Mes</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Ingresos Activos</h2>
        </div>
        
        {activeAdmissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay ingresos activos en este momento
            <div className="mt-4">
              <Link
                href="/hospitalizacion/admitir"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                Ingresar primer paciente
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Habitación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnóstico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeAdmissions.map((admission) => (
                  <tr key={admission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admission.patientId}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {admission.patientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {admission.room} - Cama {admission.bed}
                      </div>
                      <div className="text-sm text-gray-500">
                        {admission.service}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {admission.diagnosis}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(admission.admissionDate).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(admission.admissionDate).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/hospitalizacion/${admission.id}`}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/hospitalizacion/${admission.id}/enfermeria`}
                          className="text-green-600 hover:text-green-900 px-3 py-1 rounded border border-green-600 hover:bg-green-50 transition-colors"
                        >
                          Cuidados
                        </Link>
                        <Link
                          href={`/hospitalizacion/${admission.id}/medico`}
                          className="text-purple-600 hover:text-purple-900 px-3 py-1 rounded border border-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          Médico
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/hospitalizacion/admitir"
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Nuevo Ingreso</div>
            <div className="text-sm opacity-90">Ingresar paciente</div>
          </Link>
          
          <Link
            href="/hospitalizacion/altas"
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Gestión de Altas</div>
            <div className="text-sm opacity-90">Dar altas médicas</div>
          </Link>
          
          <Link
            href="/hospitalizacion/reportes"
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Reportes</div>
            <div className="text-sm opacity-90">Estadísticas e informes</div>
          </Link>
          
          <Link
            href="/hospitalizacion/camas"
            className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="font-semibold">Gestión de Camas</div>
            <div className="text-sm opacity-90">Estado de habitaciones</div>
          </Link>
        </div>
      </div>
    </div>
  );
}