import React, { useState, useRef } from 'react';
import { User, Submission } from '../types';
import { apiService } from '../services/apiService';
import { es } from '../locale/es';
import { CameraIcon, PaperClipIcon } from './Icons';

interface SubmissionFormProps {
  user: User;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onSubmissionSuccess: (newSubmission: Submission) => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, addNotification, onSubmissionSuccess }) => {
  const [weighingKg, setWeighingKg] = useState('');
  const [notes, setNotes] = useState('');
  const [ingressPhoto, setIngressPhoto] = useState<File | null>(null);
  const [weighingPhoto, setWeighingPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ingressFileRef = useRef<HTMLInputElement>(null);
  const weighingFileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setWeighingKg('');
    setNotes('');
    setIngressPhoto(null);
    setWeighingPhoto(null);
    if (ingressFileRef.current) ingressFileRef.current.value = '';
    if (weighingFileRef.current) weighingFileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingressPhoto || !weighingPhoto || !weighingKg) {
      addNotification(es.requiredFieldsError, 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const submissionData = {
        weighing_kg: parseFloat(weighingKg),
        notes: notes.trim() || null,
        ingress_photo: ingressPhoto,
        weighing_photo: weighingPhoto,
      };
      const newSubmission = await apiService.createSubmission(submissionData);
      addNotification(es.submissionSuccess, 'success');
      onSubmissionSuccess(newSubmission);
      resetForm();
    } catch (err: any) {
      addNotification(err.message || es.submissionCreationError, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const FileInput: React.FC<{
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement>;
  }> = ({ label, file, setFile, inputRef }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex items-center space-x-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
        >
          <CameraIcon className="w-5 h-5 mr-2 text-gray-500" />
          {es.uploadFiles}
        </button>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={inputRef}
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className="hidden"
        />
        {file && (
          <div className="flex items-center text-sm text-gray-600">
            <PaperClipIcon className="w-5 h-5 mr-1 text-gray-400" />
            <span>{file.name}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">{es.newReportTitle}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weighing_kg" className="block text-sm font-medium text-gray-700">{es.formWeighingKg}</label>
          <input
            id="weighing_kg"
            type="number"
            value={weighingKg}
            onChange={(e) => setWeighingKg(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="0.00"
          />
        </div>

        <FileInput label={es.formIngressPhoto} file={ingressPhoto} setFile={setIngressPhoto} inputRef={ingressFileRef} />
        <FileInput label={es.formWeighingPhoto} file={weighingPhoto} setFile={setWeighingPhoto} inputRef={weighingFileRef} />

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{es.formNotes}</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
          >
            {isLoading ? es.submitting : es.submitReport}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;
