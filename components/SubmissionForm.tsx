

import React, { useState, useRef } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { CameraIcon } from './Icons';
import { es } from '../locale/es';

interface SubmissionFormProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onSubmissionSuccess: () => void;
}

const ImagePreview: React.FC<{ file: File | null; onClear: () => void }> = ({ file, onClear }) => {
  if (!file) return null;

  return (
    <div className="relative mt-2">
      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-48 object-cover rounded-md" />
      <button
        type="button"
        onClick={onClear}
        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, addNotification, onSubmissionSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [ingressPhoto, setIngressPhoto] = useState<File | null>(null);
  const [weighingPhoto, setWeighingPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ingressFileRef = useRef<HTMLInputElement>(null);
  const weighingFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification("El archivo es demasiado grande (máx 5MB).", 'error');
        return;
      }
      setFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingressPhoto || !weighingPhoto || !weight || !date) {
      addNotification("Por favor, completa todos los campos requeridos.", 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await apiService.createSubmission(
        { fecha: date, pesaje_kg: parseFloat(weight), notas: notes },
        ingressPhoto,
        weighingPhoto
      );
      addNotification("Reporte enviado exitosamente.", 'success');
      onSubmissionSuccess();
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setWeight('');
      setNotes('');
      setIngressPhoto(null);
      setWeighingPhoto(null);
      if (ingressFileRef.current) ingressFileRef.current.value = '';
      if (weighingFileRef.current) weighingFileRef.current.value = '';

    } catch (err: any) {
      addNotification(err.message || 'Error al enviar el reporte.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">{es.submissionFormTitle}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">{es.colDate}</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">{es.formWeighingKg}</label>
            <input type="number" step="0.01" id="weight" value={weight} onChange={e => setWeight(e.target.value)} required placeholder="e.g., 123.45" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{es.formIngressPhoto}</label>
            <div className="mt-1 flex items-center">
              <button type="button" onClick={() => ingressFileRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <CameraIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                {ingressPhoto ? 'Cambiar Foto' : 'Seleccionar Foto'}
              </button>
              <input type="file" ref={ingressFileRef} onChange={e => handleFileChange(e, setIngressPhoto)} accept="image/*" className="hidden" />
              {ingressPhoto && <span className="ml-3 text-sm text-gray-500">{ingressPhoto.name}</span>}
            </div>
            <ImagePreview file={ingressPhoto} onClear={() => setIngressPhoto(null)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{es.formWeighingPhoto}</label>
             <div className="mt-1 flex items-center">
              <button type="button" onClick={() => weighingFileRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <CameraIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                 {weighingPhoto ? 'Cambiar Foto' : 'Seleccionar Foto'}
              </button>
              <input type="file" ref={weighingFileRef} onChange={e => handleFileChange(e, setWeighingPhoto)} accept="image/*" className="hidden" />
              {weighingPhoto && <span className="ml-3 text-sm text-gray-500">{weighingPhoto.name}</span>}
            </div>
            <ImagePreview file={weighingPhoto} onClear={() => setWeighingPhoto(null)} />
          </div>
        </div>
        
        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{es.colNotes} (Opcional)</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Añade cualquier nota relevante..."></textarea>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
            {isLoading ? es.sending : es.sendReport}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;