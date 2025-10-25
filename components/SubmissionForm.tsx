import React, { useState } from 'react';
import { User, Submission, Shift } from '../types';
import { apiService } from '../services/apiService';
import { PaperClipIcon, XCircleIcon } from './Icons';

interface SubmissionFormProps {
  user: User;
  onSubmissionSuccess: (submission: Submission) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, onSubmissionSuccess, addNotification }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [plant, setPlant] = useState('');
  const [shift, setShift] = useState<Shift>(Shift.Morning);
  const [product, setProduct] = useState('');
  const [producedQty, setProducedQty] = useState('');
  const [scrapQty, setScrapQty] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setPlant('');
    setShift(Shift.Morning);
    setProduct('');
    setProducedQty('');
    setScrapQty('');
    setNotes('');
    setPhotos([]);
    setError(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > MAX_PHOTOS) {
        addNotification(`You can only upload a maximum of ${MAX_PHOTOS} photos.`, 'error');
        return;
      }

      // Fix: Explicitly type `file` as `File` to resolve TypeScript errors.
      const validatedFiles = newFiles.filter((file: File) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            addNotification(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP are allowed.`, 'error');
            return false;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            addNotification(`File is too large: ${file.name}. Max size is ${MAX_FILE_SIZE_MB}MB.`, 'error');
            return false;
        }
        return true;
      });
      
      setPhotos(prev => [...prev, ...validatedFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Client-side validation
    if (!plant || !product || producedQty === '' || scrapQty === '') {
      setError('Please fill out all required fields.');
      addNotification('Please fill out all required fields.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const submissionData = {
        client_id: user.clientId,
        user_id: user.id,
        created_by: user.id,
        date,
        plant,
        shift,
        product,
        produced_qty: parseInt(producedQty, 10),
        scrap_qty: parseInt(scrapQty, 10),
        notes,
      };

      const newSubmission = await apiService.createSubmission(submissionData, photos);
      onSubmissionSuccess(newSubmission);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create submission.');
      addNotification(err.message || 'Failed to create submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">New Production Report</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="plant" className="block text-sm font-medium text-gray-700">Plant</label>
          <input type="text" id="plant" value={plant} onChange={e => setPlant(e.target.value)} required placeholder="e.g., Factory A" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="shift" className="block text-sm font-medium text-gray-700">Shift</label>
          <select id="shift" value={shift} onChange={e => setShift(e.target.value as Shift)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
            {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product</label>
          <input type="text" id="product" value={product} onChange={e => setProduct(e.target.value)} required placeholder="e.g., Widget Pro" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="produced_qty" className="block text-sm font-medium text-gray-700">Produced Qty</label>
              <input type="number" id="produced_qty" value={producedQty} onChange={e => setProducedQty(e.target.value)} required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="scrap_qty" className="block text-sm font-medium text-gray-700">Scrap Qty</label>
              <input type="number" id="scrap_qty" value={scrapQty} onChange={e => setScrapQty(e.target.value)} required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Photos (optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload files</span>
                            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to {MAX_FILE_SIZE_MB}MB each. Max {MAX_PHOTOS} files.</p>
                </div>
            </div>
        </div>
        {photos.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                <ul className="space-y-1">
                    {photos.map((file, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded">
                            <span className="truncate">{file.name}</span>
                            <button type="button" onClick={() => removePhoto(index)}><XCircleIcon className="h-5 w-5 text-red-500 hover:text-red-700" /></button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300">
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;
