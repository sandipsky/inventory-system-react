import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
  type Ref,
} from 'react';
import './file-upload.css';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';
export type UploadVariant = 'dropzone' | 'button';
export type UploadListType = 'list' | 'grid';
export type RejectReason = 'type' | 'size' | 'count';

/** A tracked file in the uploader's list. */
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  /** 0–100. Drive this from your real upload via {@link LUIFileUploadRef.patchFile}. */
  progress: number;
  /** Object URL (images) or a remote URL for the thumbnail. */
  url?: string;
  error?: string;
}

/** Imperative surface reachable through the `ref` prop. */
export interface LUIFileUploadRef {
  /**
   * Patch a tracked file — call this as your real upload progresses, e.g.
   * `patchFile(id, { status: 'uploading', progress: 40 })`.
   */
  patchFile: (id: string, patch: Partial<Omit<UploadFile, 'id' | 'file'>>) => void;
  /** Remove every file. */
  clear: () => void;
}

let _uid = 0;

export interface LUIFileUploadProps {
  /** Native `accept` filter, e.g. `image/*` or `.pdf,.docx`. */
  accept?: string;
  multiple?: boolean;
  /** Reject files larger than this many megabytes (0 = no limit). */
  maxSizeMb?: number;
  /** Cap the number of files kept (0 = no limit). */
  maxCount?: number;
  disabled?: boolean;
  variant?: UploadVariant;
  listType?: UploadListType;
  /** Primary line inside the dropzone. */
  label?: string;
  /** Secondary hint (defaults to a summary of the accept/size limits). */
  hint?: string;
  /** The tracked files. Controlled when provided (pair with `onFilesChange`). */
  files?: UploadFile[];
  /** Fires with the full list whenever it changes (the Angular two-way `files` model). */
  onFilesChange?: (files: UploadFile[]) => void;
  /** Accepted files, as they are added. Kick off your upload here. */
  onAdded?: (files: UploadFile[]) => void;
  onRemoved?: (file: UploadFile) => void;
  onRejected?: (rejection: { file: File; reason: RejectReason }) => void;
  /** Imperative handle exposing `patchFile()` / `clear()`. */
  ref?: Ref<LUIFileUploadRef>;
  className?: string;
}

/**
 * Image / file upload with a drag-and-drop dropzone (or a compact button
 * trigger), inspired by Ant Design's `Upload`. Validates by `accept`, size and
 * count, shows image thumbnails, and renders a list (rows) or grid (cards) with
 * per-file progress and a remove control.
 *
 * The component is presentational: it manages selection, validation, previews
 * and the list. Wire your real upload by handling `onAdded` and reporting
 * progress/outcome back through the ref's `patchFile`.
 *
 * ```tsx
 * <LUIFileUpload ref={uploader} accept="image/*" multiple maxSizeMb={5}
 *                listType="grid" onAdded={upload} onFilesChange={setFiles} />
 * ```
 */
export function LUIFileUpload({
  accept = '',
  multiple = true,
  maxSizeMb = 0,
  maxCount = 0,
  disabled = false,
  variant = 'dropzone',
  listType = 'list',
  label = 'Click or drag files here to upload',
  hint = '',
  files: filesProp,
  onFilesChange,
  onAdded,
  onRemoved,
  onRejected,
  ref,
  className,
}: LUIFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  const [internalFiles, setInternalFiles] = useState<UploadFile[]>(() => filesProp ?? []);
  const files = filesProp ?? internalFiles;

  /* Latest list for the imperative handle (patchFile may fire from timers). */
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setFiles = (next: UploadFile[]): void => {
    filesRef.current = next;
    setInternalFiles(next);
    onFilesChange?.(next);
  };

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const hostClasses = [
    'l-upload',
    `l-upload--${variant}`,
    `l-upload--${listType}`,
    disabled ? 'is-disabled' : '',
    dragging ? 'is-dragging' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  /* In single-file mode, hide the trigger once a file is chosen (shown again on remove). */
  const showTrigger = multiple || files.length === 0;

  const resolvedHint = (() => {
    if (hint) return hint;
    const parts: string[] = [];
    if (accept) parts.push(accept);
    if (maxSizeMb) parts.push(`up to ${maxSizeMb} MB`);
    return parts.join(' · ');
  })();

  const browse = (): void => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.target;
    if (input.files?.length) ingest(input.files);
    // Reset so selecting the same file again still fires `change`.
    input.value = '';
  };

  const onDragOver = (event: DragEvent): void => {
    if (disabled) return;
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    setDragging(false);
  };

  const onDrop = (event: DragEvent): void => {
    if (disabled) return;
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer?.files.length) ingest(event.dataTransfer.files);
  };

  const remove = (item: UploadFile, event: MouseEvent): void => {
    event.stopPropagation();
    revoke(item);
    setFiles(filesRef.current.filter((f) => f.id !== item.id));
    onRemoved?.(item);
  };

  const isImage = (item: UploadFile): boolean => item.type.startsWith('image/');

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  useImperativeHandle(ref, () => ({
    patchFile: (id, patch) => {
      setFiles(filesRef.current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    clear: () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
      setFiles([]);
    },
  }));

  const ingest = (fileList: FileList): void => {
    const incoming = Array.from(fileList);
    const accepted: UploadFile[] = [];

    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        onRejected?.({ file, reason: 'type' });
        continue;
      }
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        onRejected?.({ file, reason: 'size' });
        continue;
      }
      accepted.push(toUploadFile(file));
    }

    if (!accepted.length) return;

    if (!multiple) {
      // Single-file mode: the newest selection replaces the list.
      filesRef.current.forEach((item) => revoke(item));
      const last = accepted[accepted.length - 1];
      setFiles([last]);
      onAdded?.([last]);
      return;
    }

    let next = [...filesRef.current, ...accepted];
    let kept = accepted;
    if (maxCount && next.length > maxCount) {
      const overflow = next.slice(maxCount);
      overflow.forEach((f) => {
        revoke(f);
        onRejected?.({ file: f.file, reason: 'count' });
      });
      next = next.slice(0, maxCount);
      kept = accepted.filter((f) => next.includes(f));
    }

    setFiles(next);
    if (kept.length) onAdded?.(kept);
  };

  const toUploadFile = (file: File): UploadFile => {
    let url: string | undefined;
    if (file.type.startsWith('image/')) {
      url = URL.createObjectURL(file);
      objectUrls.current.add(url);
    }
    return {
      id: `l-upload-${_uid++}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      url,
    };
  };

  const revoke = (item: UploadFile): void => {
    if (item.url && objectUrls.current.has(item.url)) {
      URL.revokeObjectURL(item.url);
      objectUrls.current.delete(item.url);
    }
  };

  return (
    <div className={hostClasses}>
      <input
        ref={inputRef}
        type="file"
        className="l-upload__input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onInputChange}
      />

      {showTrigger && variant === 'dropzone' ? (
        <button
          type="button"
          className="l-upload__dropzone"
          disabled={disabled}
          onClick={browse}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <svg
            className="l-upload__cloud"
            width="40"
            height="40"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 30a8 8 0 0 1-.8-15.96A11 11 0 0 1 34.7 16.2 8.5 8.5 0 0 1 34 33"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M24 22v14M18.5 27.5 24 22l5.5 5.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="l-upload__label">{label}</span>
          {resolvedHint && <span className="l-upload__hint">{resolvedHint}</span>}
        </button>
      ) : showTrigger ? (
        <div className="l-upload__trigger-row">
          <button type="button" className="l-upload__trigger" disabled={disabled} onClick={browse}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Upload</span>
          </button>
          {resolvedHint && <span className="l-upload__hint">{resolvedHint}</span>}
        </div>
      ) : null}

      {files.length > 0 && (
        <ul className={['l-upload__files', listType === 'grid' ? 'is-grid' : ''].filter(Boolean).join(' ')}>
          {files.map((item) => (
            <li key={item.id} className={`l-upload__file is-${item.status}`}>
              <div className="l-upload__thumb">
                {isImage(item) && item.url ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M11 2H5.5A1.5 1.5 0 0 0 4 3.5v13A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V7l-5-5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path d="M11 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                )}

                {item.status === 'success' ? (
                  <span className="l-upload__badge l-upload__badge--success" aria-label="Uploaded">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 10.5 8.5 14 15 6.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : item.status === 'error' ? (
                  <span className="l-upload__badge l-upload__badge--error" aria-label="Failed">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M10 5v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="10" cy="14.5" r="1.2" fill="currentColor" />
                    </svg>
                  </span>
                ) : null}
              </div>

              <div className="l-upload__meta">
                <span className="l-upload__name" title={item.name}>
                  {item.name}
                </span>
                <span className="l-upload__sub">
                  {item.status === 'error'
                    ? item.error || 'Upload failed'
                    : item.status === 'uploading'
                      ? `${item.progress}%`
                      : formatSize(item.size)}
                </span>

                {item.status === 'uploading' && (
                  <span className="l-upload__progress">
                    <span className="l-upload__progress-bar" style={{ width: `${item.progress}%` }} />
                  </span>
                )}
              </div>

              <button
                type="button"
                className="l-upload__remove"
                aria-label={`Remove ${item.name}`}
                onClick={(event) => remove(item, event)}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function matchesAccept(file: File, accept: string): boolean {
  const trimmed = accept.trim();
  if (!trimmed) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return trimmed.split(',').some((raw) => {
    const token = raw.trim().toLowerCase();
    if (!token) return false;
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}
