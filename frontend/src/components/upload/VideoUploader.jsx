import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { mediaAPI } from '../../utils/api';

const VideoUploader = ({ onUploadSuccess, isOpen, onClose }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [errors, setErrors] = useState({});
    const [completed, setCompleted] = useState({});
    const fileInputRef = useRef(null);
    const dragOverRef = useRef(false);

    const ALLOWED_FORMATS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'mxf', '3gp'];
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

    const isAllowedFormat = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        return ALLOWED_FORMATS.includes(ext);
    };

    const validateFile = (file) => {
        if (!isAllowedFormat(file.name)) {
            return `Invalid format. Allowed: ${ALLOWED_FORMATS.join(', ')}`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `File too large. Max 500MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
        }
        return null;
    };

    const handleFileSelect = (selectedFiles) => {
        const newFiles = Array.from(selectedFiles);
        const validatedFiles = [];
        const newErrors = {};

        newFiles.forEach((file) => {
            const error = validateFile(file);
            if (error) {
                newErrors[file.name] = error;
            } else {
                validatedFiles.push(file);
            }
        });

        setFiles((prev) => [...prev, ...validatedFiles]);
        setErrors((prev) => ({ ...prev, ...newErrors }));
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        dragOverRef.current = true;
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragOverRef.current = false;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dragOverRef.current = false;
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (filename) => {
        setFiles((prev) => prev.filter((f) => f.name !== filename));
        const { [filename]: _, ...rest } = errors;
        setErrors(rest);
        const { [filename]: __, ...rest2 } = uploadProgress;
        setUploadProgress(rest2);
        const { [filename]: ___, ...rest3 } = completed;
        setCompleted(rest3);
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    setUploadProgress((prev) => ({
                        ...prev,
                        [file.name]: progress
                    }));
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            setCompleted((prev) => ({
                ...prev,
                [file.name]: true
            }));

            return true;
        } catch (error) {
            setErrors((prev) => ({
                ...prev,
                [file.name]: error.message
            }));
            return false;
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of files) {
            const success = await uploadFile(file);
            if (success) {
                successCount++;
            }
            // Add small delay between uploads
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        setUploading(false);

        // Call callback with results
        if (onUploadSuccess) {
            onUploadSuccess({
                total: files.length,
                successful: successCount,
                failed: files.length - successCount
            });
        }

        // Clear completed files after 2 seconds
        setTimeout(() => {
            setFiles((prev) =>
                prev.filter((f) => !completed[f.name])
            );
            setCompleted({});
        }, 2000);
    };

    if (!isOpen) return null;

    const hasErrors = Object.keys(errors).length > 0;
    const hasCompleted = Object.keys(completed).length > 0;
    const allCompleted = files.length > 0 && files.every((f) => completed[f.name]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold dark:text-white">Upload Videos</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Drag & Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                            dragOverRef.current
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-semibold mb-2 dark:text-white">
                            Drop videos here or click to select
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Supported: {ALLOWED_FORMATS.join(', ')} (Max 500MB each)
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ALLOWED_FORMATS.map((f) => `.${f}`).join(',')}
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Select Files
                        </button>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-4 dark:text-white">
                                Files to Upload ({files.length})
                            </h3>
                            <div className="space-y-3">
                                {files.map((file) => {
                                    const progress = uploadProgress[file.name] || 0;
                                    const isComplete = completed[file.name];
                                    const hasError = errors[file.name];

                                    return (
                                        <div
                                            key={file.name}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        >
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {hasError ? (
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                ) : isComplete ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : uploading && progress > 0 ? (
                                                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                                                ) : (
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>

                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate dark:text-white">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>

                                                {/* Error Message */}
                                                {hasError && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {hasError}
                                                    </p>
                                                )}

                                                {/* Progress Bar */}
                                                {uploading && progress > 0 && !isComplete && (
                                                    <div className="mt-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            {!uploading && (
                                                <button
                                                    onClick={() => removeFile(file.name)}
                                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Progress Text */}
                                            {uploading && progress > 0 && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                                                    {progress}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {files.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">
                                No files selected yet
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading || allCompleted}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading && <Loader className="w-4 h-4 animate-spin" />}
                        {allCompleted ? 'Done!' : `Upload ${files.length}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoUploader;
